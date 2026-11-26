import {
  FeedbackPayload,
  MAX_PAYLOAD_BYTES,
  formatLinearIssueBody,
  formatLinearIssueTitle,
  validateFeedbackPayload,
} from './feedback.js';

const LINEAR_GRAPHQL_URL = 'https://api.linear.app/graphql';
const LINEAR_TEAM_KEY = 'JER';
const LINEAR_TIMEOUT_MS = 8000;

export interface RateLimiter {
  check(
    key: string,
    now?: number
  ): { allowed: true; remaining: number } | { allowed: false; retryAfterSeconds: number };
  reset(): void;
}

/**
 * Best-effort per-instance fixed-window rate limiter for Vercel Functions.
 * Caps stored IP buckets to prevent unbounded memory growth on long-lived warm instances.
 */
export function createFeedbackRateLimiter(options?: {
  windowMs?: number;
  maxRequests?: number;
  maxBuckets?: number;
}): RateLimiter {
  const windowMs = options?.windowMs ?? 60_000;
  const maxRequests = options?.maxRequests ?? 10;
  const maxBuckets = options?.maxBuckets ?? 1000;
  const buckets = new Map<string, { count: number; resetAt: number }>();

  function pruneExpired(now: number) {
    for (const [k, entry] of buckets) {
      if (entry.resetAt <= now) {
        buckets.delete(k);
      }
    }
    while (buckets.size >= maxBuckets) {
      const oldestKey = buckets.keys().next().value;
      if (oldestKey === undefined) break;
      buckets.delete(oldestKey);
    }
  }

  return {
    check(key: string, now: number = Date.now()) {
      const existing = buckets.get(key);
      if (!existing || existing.resetAt <= now) {
        if (buckets.size >= maxBuckets) {
          pruneExpired(now);
        }
        buckets.set(key, { count: 1, resetAt: now + windowMs });
        return { allowed: true, remaining: Math.max(0, maxRequests - 1) };
      }

      if (existing.count >= maxRequests) {
        const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
        return { allowed: false, retryAfterSeconds };
      }

      existing.count += 1;
      return { allowed: true, remaining: Math.max(0, maxRequests - existing.count) };
    },
    reset() {
      buckets.clear();
    },
  };
}

const defaultRateLimiter = createFeedbackRateLimiter();
let cachedTeamId: string | null = null;

function jsonResponse(
  status: number,
  body: Record<string, unknown>,
  extraHeaders?: Record<string, string>
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...extraHeaders,
    },
  });
}

function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first.slice(0, 64);
  }
  const realIp = request.headers.get('x-real-ip')?.trim();
  if (realIp) return realIp.slice(0, 64);
  return 'unknown';
}

function redactSecret(text: string, secret: string): string {
  if (!secret) return text;
  return text.split(secret).join('[REDACTED]');
}

async function callLinearGraphQL(
  apiKey: string,
  fetchFn: typeof fetch,
  query: string,
  variables: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const res = await fetchFn(LINEAR_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: apiKey,
    },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(LINEAR_TIMEOUT_MS),
  });

  const parsed = (await res.json().catch(() => null)) as {
    data?: Record<string, unknown>;
    errors?: Array<{ message?: string }>;
  } | null;

  if (!res.ok || !parsed || parsed.errors?.length || !parsed.data) {
    const firstErr = parsed?.errors?.[0]?.message || `HTTP ${res.status}`;
    throw new Error(`Linear API error (${res.status}): ${redactSecret(String(firstErr), apiKey).slice(0, 200)}`);
  }

  return parsed.data;
}

export async function createLinearFeedbackIssue(
  payload: FeedbackPayload,
  deps: { apiKey: string; fetchFn?: typeof fetch; teamId?: string }
): Promise<{ identifier: string; url: string; title: string }> {
  const fetchFn = deps.fetchFn ?? fetch;
  const allowModuleCache = !deps.fetchFn;

  let teamId = deps.teamId ?? (allowModuleCache ? cachedTeamId : null);
  if (!teamId) {
    const teamData = await callLinearGraphQL(
      deps.apiKey,
      fetchFn,
      'query($key: String!) { teams(filter: { key: { eq: $key } }) { nodes { id } } }',
      { key: LINEAR_TEAM_KEY }
    );
    const nodes = (teamData.teams as { nodes?: Array<{ id?: string }> } | undefined)?.nodes;
    teamId = nodes?.[0]?.id ?? null;
    if (!teamId) {
      throw new Error(`Linear team ${LINEAR_TEAM_KEY} not found`);
    }
    if (allowModuleCache) {
      cachedTeamId = teamId;
    }
  }

  const title = formatLinearIssueTitle(payload);
  const description = formatLinearIssueBody(payload);

  const issueData = await callLinearGraphQL(
    deps.apiKey,
    fetchFn,
    'mutation($input: IssueCreateInput!) { issueCreate(input: $input) { success issue { identifier url } } }',
    { input: { teamId, title, description } }
  );

  const created = issueData.issueCreate as
    | { success?: boolean; issue?: { identifier?: string; url?: string } }
    | undefined;
  const identifier = created?.issue?.identifier;
  const url = created?.issue?.url;

  if (!created?.success || !identifier || !url) {
    throw new Error('Linear issueCreate did not return an issue identifier and URL');
  }

  return { identifier, url, title };
}

export interface FeedbackHandlerDeps {
  apiKey?: string;
  fetchFn?: typeof fetch;
  rateLimiter?: RateLimiter;
  now?: number;
  teamId?: string;
}

export async function handleFeedbackRequest(
  request: Request,
  deps: FeedbackHandlerDeps = {}
): Promise<Response> {
  if (request.method !== 'POST') {
    return jsonResponse(
      405,
      { ok: false, error: 'Method not allowed. Use POST.', code: 'METHOD_NOT_ALLOWED' },
      { Allow: 'POST' }
    );
  }

  const rateLimiter = deps.rateLimiter ?? defaultRateLimiter;
  const rateCheck = rateLimiter.check(getClientIp(request), deps.now);
  if (!rateCheck.allowed) {
    return jsonResponse(
      429,
      { ok: false, error: 'Too many feedback submissions. Please wait a moment.', code: 'RATE_LIMITED' },
      { 'Retry-After': String(rateCheck.retryAfterSeconds) }
    );
  }

  const declaredLength = Number(request.headers.get('content-length') || '0');
  if (Number.isFinite(declaredLength) && declaredLength > MAX_PAYLOAD_BYTES) {
    return jsonResponse(413, {
      ok: false,
      error: 'Feedback payload is too large.',
      code: 'PAYLOAD_TOO_LARGE',
    });
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return jsonResponse(400, {
      ok: false,
      error: 'Unable to read request body.',
      code: 'INVALID_BODY',
    });
  }

  if (new TextEncoder().encode(rawBody).byteLength > MAX_PAYLOAD_BYTES) {
    return jsonResponse(413, {
      ok: false,
      error: 'Feedback payload is too large.',
      code: 'PAYLOAD_TOO_LARGE',
    });
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawBody);
  } catch {
    return jsonResponse(400, {
      ok: false,
      error: 'Invalid JSON payload.',
      code: 'INVALID_JSON',
    });
  }

  const validated = validateFeedbackPayload(parsedJson);
  if (!validated.ok) {
    return jsonResponse(400, {
      ok: false,
      error: validated.error,
      code: 'VALIDATION_ERROR',
    });
  }

  const apiKey = (deps.apiKey !== undefined ? deps.apiKey : process.env.LINEAR_API_KEY ?? '').trim();
  if (!apiKey) {
    console.error('[ERROR] feedback not filed to Linear: LINEAR_API_KEY is not configured');
    return jsonResponse(503, {
      ok: false,
      error: 'Direct submission is not configured on this server.',
      code: 'MISSING_API_KEY',
    });
  }

  try {
    const issue = await createLinearFeedbackIssue(validated.data, {
      apiKey,
      fetchFn: deps.fetchFn,
      teamId: deps.teamId,
    });
    return jsonResponse(201, {
      ok: true,
      issue,
    });
  } catch (err: unknown) {
    const rawMsg = err instanceof Error ? err.message : String(err);
    const safeMsg = redactSecret(rawMsg, apiKey).slice(0, 240);
    console.error(`[ERROR] feedback failed to file to Linear: ${safeMsg}`);
    return jsonResponse(502, {
      ok: false,
      error: 'Could not reach Linear to save your report.',
      code: 'UPSTREAM_ERROR',
    });
  }
}
