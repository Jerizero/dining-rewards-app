import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import {
  FEEDBACK_APP_ID,
  MAX_PAYLOAD_BYTES,
  MAX_TEXT_LENGTH,
  buildFeedbackPayload,
  buildFeedbackText,
  formatLinearIssueBody,
  formatLinearIssueTitle,
  formatReportForCopy,
  validateFeedbackPayload,
} from '../src/utils/feedback';
import {
  createFeedbackRateLimiter,
  handleFeedbackRequest,
} from '../src/utils/feedbackHandler';

describe('feedback payload formatting & sanitization', () => {
  it('builds structured payload for venue-card with quick chips and free text', () => {
    const text = buildFeedbackText(['Wrong cuisine', 'Wrong area'], 'Actually Thai in Nolita');
    assert.equal(text, 'Wrong cuisine, Wrong area: Actually Thai in Nolita');

    const payload = buildFeedbackPayload({
      surface: 'venue-card',
      itemId: 'swagat',
      itemName: 'Swagat',
      selectedChips: ['Wrong cuisine'],
      note: 'Actually Indian',
      timestamp: '2026-11-26T20:30:00.000Z',
    });

    assert.deepEqual(payload, {
      app: FEEDBACK_APP_ID,
      surface: 'venue-card',
      item_id: 'swagat',
      item_name: 'Swagat',
      text: 'Wrong cuisine: Actually Indian',
      timestamp: '2026-11-26T20:30:00.000Z',
    });
  });

  it('builds global payload for header surface and formats title/body/copy report', () => {
    const payload = buildFeedbackPayload({
      surface: 'header',
      itemId: 'global',
      selectedChips: [],
      note: 'Add a filter for Resy Rewards\n\nPlease show 8x badge clearly',
      timestamp: '2026-11-26T20:30:00.000Z',
    });

    assert.equal(payload.item_id, 'global');
    assert.equal(
      formatLinearIssueTitle(payload),
      '[dining-rewards-app] Improve request: Add a filter for Resy Rewards Please show 8x badge clearly'
    );

    const body = formatLinearIssueBody(payload);
    assert.match(body, /\*\*app:\*\* `dining-rewards-app`/);
    assert.match(body, /\*\*surface:\*\* `header`/);
    assert.match(body, /\*\*item_id:\*\* `global`/);
    assert.match(body, /\*\*timestamp:\*\* `2026-11-26T20:30:00\.000Z`/);
    assert.match(body, /Add a filter for Resy Rewards/);

    const copied = formatReportForCopy(payload);
    assert.match(copied, /^\[dining-rewards-app\] Improve request:/);
    assert.match(copied, /surface: header/);
    assert.match(copied, /item_id: global/);
  });

  it('truncates long titles cleanly at 72 chars', () => {
    const payload = buildFeedbackPayload({
      surface: 'venue-card',
      itemId: 'v-1',
      note: 'A'.repeat(120),
      timestamp: '2026-11-26T20:30:00.000Z',
    });
    const title = formatLinearIssueTitle(payload);
    assert.equal(title, `[dining-rewards-app] Improve request: ${'A'.repeat(72)}...`);
  });

  it('validates and sanitizes incoming payloads, stripping control chars and unsafe URLs', () => {
    const res = validateFeedbackPayload({
      app: 'dining-rewards-app',
      surface: 'venue-card',
      item_id: 'spot-1\n\r\u0000\u202E',
      item_name: 'Spot\u0007 One',
      text: 'Wrong\u0000 area\r\n\r\n\r\nShould be SoHo```injected```',
      timestamp: '2026-11-26T20:30:00Z',
      url: 'javascript:alert(1)',
      viewport: '390x844',
      extraMaliciousField: 'ignored',
    });

    assert.equal(res.ok, true);
    if (!res.ok) return;
    assert.equal(res.data.item_id, 'spot-1');
    assert.equal(res.data.item_name, 'Spot One');
    assert.equal(res.data.text, 'Wrong area\n\nShould be SoHo```injected```');
    assert.equal(res.data.timestamp, '2026-11-26T20:30:00.000Z');
    assert.equal(res.data.url, undefined);
    assert.equal(res.data.viewport, '390x844');
    assert.equal('extraMaliciousField' in res.data, false);

    const mdBody = formatLinearIssueBody(res.data);
    assert.ok(!mdBody.includes('```'), 'triple backticks neutralized in markdown');
  });

  it('rejects invalid surfaces, empty/oversized text, and bad timestamps', () => {
    const base = {
      app: 'dining-rewards-app',
      surface: 'venue-card',
      item_id: 'v1',
      text: 'Valid note',
      timestamp: '2026-11-26T20:30:00.000Z',
    };

    assert.equal(validateFeedbackPayload(null).ok, false);
    assert.equal(validateFeedbackPayload({ ...base, surface: 'admin' }).ok, false);
    assert.equal(validateFeedbackPayload({ ...base, item_id: '   ' }).ok, false);
    assert.equal(validateFeedbackPayload({ ...base, text: 'a' }).ok, false);
    assert.equal(validateFeedbackPayload({ ...base, text: 'x'.repeat(MAX_TEXT_LENGTH + 1) }).ok, false);
    assert.equal(validateFeedbackPayload({ ...base, timestamp: 'not-a-date' }).ok, false);
  });
});

describe('api/feedback serverless handler', () => {
  const validPayload = {
    app: 'dining-rewards-app',
    surface: 'venue-card',
    item_id: 'grotta-azzurra',
    item_name: 'Grotta Azzurra',
    text: 'Wrong area: Should be Nolita / Little Italy',
    timestamp: '2026-11-26T20:30:00.000Z',
  };

  function makeReq(body: unknown, opts?: { method?: string; ip?: string; headers?: Record<string, string> }) {
    const raw = typeof body === 'string' ? body : JSON.stringify(body);
    return new Request('https://example.test/api/feedback', {
      method: opts?.method ?? 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': opts?.ip ?? '1.2.3.4',
        ...opts?.headers,
      },
      body: opts?.method === 'GET' ? undefined : raw,
    });
  }

  it('rejects non-POST methods with 405', async () => {
    const res = await handleFeedbackRequest(makeReq('', { method: 'GET' }), {
      rateLimiter: createFeedbackRateLimiter(),
    });
    assert.equal(res.status, 405);
    assert.equal(res.headers.get('allow'), 'POST');
  });

  it('enforces payload size cap (413)', async () => {
    const huge = { ...validPayload, text: 'a'.repeat(MAX_PAYLOAD_BYTES + 100) };
    const res = await handleFeedbackRequest(makeReq(huge), {
      rateLimiter: createFeedbackRateLimiter(),
    });
    assert.equal(res.status, 413);
    const json = (await res.json()) as { ok: boolean; code: string };
    assert.equal(json.ok, false);
    assert.equal(json.code, 'PAYLOAD_TOO_LARGE');
  });

  it('enforces per-IP rate limiting (429)', async () => {
    const limiter = createFeedbackRateLimiter({ windowMs: 60_000, maxRequests: 2 });
    const fetchFn = (async () =>
      new Response(
        JSON.stringify({
          data: {
            teams: { nodes: [{ id: 'team-jer' }] },
            issueCreate: { success: true, issue: { identifier: 'JER-900', url: 'https://linear.app/jeriel/issue/JER-900' } },
          },
        }),
        { status: 200 }
      )) as unknown as typeof fetch;

    const r1 = await handleFeedbackRequest(makeReq(validPayload, { ip: '9.9.9.9' }), {
      apiKey: 'lin_secret_test',
      fetchFn,
      rateLimiter: limiter,
      now: 1000,
    });
    const r2 = await handleFeedbackRequest(makeReq(validPayload, { ip: '9.9.9.9' }), {
      apiKey: 'lin_secret_test',
      fetchFn,
      rateLimiter: limiter,
      now: 2000,
    });
    const r3 = await handleFeedbackRequest(makeReq(validPayload, { ip: '9.9.9.9' }), {
      apiKey: 'lin_secret_test',
      fetchFn,
      rateLimiter: limiter,
      now: 3000,
    });

    assert.equal(r1.status, 201);
    assert.equal(r2.status, 201);
    assert.equal(r3.status, 429);
    assert.ok(Number(r3.headers.get('retry-after')) >= 1);
  });

  it('returns clear non-200 error when LINEAR_API_KEY is missing without calling fetch', async () => {
    const fetchMock = mock.fn();
    const errMock = mock.method(console, 'error', () => {});
    const res = await handleFeedbackRequest(makeReq(validPayload), {
      apiKey: '',
      fetchFn: fetchMock as unknown as typeof fetch,
      rateLimiter: createFeedbackRateLimiter(),
    });
    errMock.mock.restore();

    assert.equal(res.status, 503);
    assert.equal(fetchMock.mock.callCount(), 0);
    const json = (await res.json()) as { ok: boolean; code: string; error: string };
    assert.equal(json.ok, false);
    assert.equal(json.code, 'MISSING_API_KEY');
    assert.equal(res.headers.get('cache-control'), 'no-store');
  });

  it('never leaks API key when Linear fails with 500 and returns 502', async () => {
    const secret = 'lin_api_super_secret_token_12345';
    const fetchFn = (async () =>
      new Response(JSON.stringify({ errors: [{ message: `Unauthorized with ${secret}` }] }), {
        status: 500,
      })) as unknown as typeof fetch;

    const errLogs: string[] = [];
    const errMock = mock.method(console, 'error', (msg: unknown) => {
      errLogs.push(String(msg));
    });

    const res = await handleFeedbackRequest(makeReq(validPayload), {
      apiKey: secret,
      fetchFn,
      rateLimiter: createFeedbackRateLimiter(),
    });
    errMock.mock.restore();

    assert.equal(res.status, 502);
    const bodyText = await res.text();
    assert.ok(!bodyText.includes(secret), 'response must never contain LINEAR_API_KEY');
    assert.ok(!errLogs.join('\n').includes(secret), 'logs must redact LINEAR_API_KEY');
  });

  it('creates a Linear JER issue with exact title and structured body on success', async () => {
    const calls: Array<{ auth: string; query: string; variables: Record<string, unknown> }> = [];
    const fetchFn = (async (_url: string, init: RequestInit) => {
      const parsed = JSON.parse(String(init.body)) as { query: string; variables: Record<string, unknown> };
      const headers = init.headers as Record<string, string>;
      calls.push({ auth: headers.Authorization, query: parsed.query, variables: parsed.variables });

      const data = parsed.query.includes('teams(')
        ? { teams: { nodes: [{ id: 'team-jer-id' }] } }
        : {
            issueCreate: {
              success: true,
              issue: { identifier: 'JER-999', url: 'https://linear.app/jeriel/issue/JER-999' },
            },
          };
      return new Response(JSON.stringify({ data }), { status: 200 });
    }) as unknown as typeof fetch;

    const res = await handleFeedbackRequest(makeReq(validPayload), {
      apiKey: 'lin_api_valid',
      fetchFn,
      rateLimiter: createFeedbackRateLimiter(),
    });

    assert.equal(res.status, 201);
    const json = (await res.json()) as { ok: boolean; issue: { identifier: string; url: string; title: string } };
    assert.equal(json.ok, true);
    assert.equal(json.issue.identifier, 'JER-999');
    assert.equal(json.issue.url, 'https://linear.app/jeriel/issue/JER-999');
    assert.equal(
      json.issue.title,
      '[dining-rewards-app] Improve request: Wrong area: Should be Nolita / Little Italy'
    );

    const createCall = calls.find((c) => c.query.includes('issueCreate'));
    assert.ok(createCall);
    assert.equal(createCall.auth, 'lin_api_valid');
    const issueInput = createCall.variables.input as { teamId: string; title: string; description: string };
    assert.equal(issueInput.teamId, 'team-jer-id');
    assert.match(issueInput.description, /dining-rewards-app/);
    assert.match(issueInput.description, /venue-card/);
    assert.match(issueInput.description, /grotta-azzurra/);
    assert.match(issueInput.description, /2026-11-26T20:30:00\.000Z/);
  });
});
