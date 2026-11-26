export const FEEDBACK_APP_ID = 'dining-rewards-app';

export type FeedbackSurface = 'venue-card' | 'header';

export const ALLOWED_SURFACES: ReadonlySet<string> = new Set<FeedbackSurface>([
  'venue-card',
  'header',
]);

export const QUICK_CHIPS_BY_SURFACE: Record<FeedbackSurface, readonly string[]> = {
  'venue-card': ['Wrong cuisine', 'Wrong area', 'Stale rate', 'Closed'],
  header: ['Bug / broken UI', 'Missing venue', 'Filter issue', 'Feature idea'],
};

export const MAX_APP_LENGTH = 64;
export const MAX_ITEM_ID_LENGTH = 160;
export const MAX_ITEM_NAME_LENGTH = 160;
export const MAX_TEXT_LENGTH = 2000;
export const MAX_URL_LENGTH = 500;
export const MAX_VIEWPORT_LENGTH = 32;
export const MAX_PAYLOAD_BYTES = 16 * 1024;
export const MIN_TEXT_LENGTH = 2;

export interface FeedbackPayload {
  app: string;
  surface: FeedbackSurface;
  item_id: string;
  text: string;
  timestamp: string;
  item_name?: string;
  url?: string;
  viewport?: string;
}

export type ValidationResult =
  | { ok: true; data: FeedbackPayload }
  | { ok: false; error: string };

const CONTROL_CHARS_SINGLE = /[\u0000-\u001F\u007F\u200B-\u200F\u202A-\u202E\u2066-\u2069]/g;
const CONTROL_CHARS_MULTI = /[\u0000-\u0008\u000B-\u001F\u007F\u200B-\u200F\u202A-\u202E\u2066-\u2069]/g;
const APP_SLUG_RE = /^[a-z0-9][a-z0-9-]{1,63}$/;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/;
const VIEWPORT_RE = /^\d{2,5}x\d{2,5}$/;

export function sanitizeSingleLine(value: string, maxLen?: number): string {
  const cleaned = value.replace(CONTROL_CHARS_SINGLE, ' ').replace(/\s+/g, ' ').trim();
  return typeof maxLen === 'number' ? cleaned.slice(0, maxLen).trim() : cleaned;
}

export function sanitizeMultiline(value: string, maxLen?: number): string {
  const cleaned = value
    .replace(/\r\n?/g, '\n')
    .replace(/\t/g, ' ')
    .replace(CONTROL_CHARS_MULTI, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return typeof maxLen === 'number' ? cleaned.slice(0, maxLen).trim() : cleaned;
}

export function sanitizeHttpUrl(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined;
  const cleaned = sanitizeSingleLine(raw, MAX_URL_LENGTH);
  if (!cleaned) return undefined;
  try {
    const parsed = new URL(cleaned);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return undefined;
    }
    return parsed.toString().slice(0, MAX_URL_LENGTH);
  } catch {
    return undefined;
  }
}

function escapeInlineCode(value: string): string {
  return value.replace(/`/g, "'");
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Combines selected 1-tap quick chips and optional free-text notes into a single
 * clean feedback string without duplicating chip labels.
 */
export function buildFeedbackText(selectedChips: readonly string[], note: string): string {
  const cleanChips = Array.from(
    new Set(
      selectedChips
        .map((c) => sanitizeSingleLine(c, 60))
        .filter(Boolean)
    )
  );
  const cleanNote = sanitizeMultiline(note, MAX_TEXT_LENGTH);

  if (cleanChips.length > 0 && cleanNote) {
    return sanitizeMultiline(`${cleanChips.join(', ')}: ${cleanNote}`, MAX_TEXT_LENGTH);
  }
  if (cleanChips.length > 0) {
    return sanitizeMultiline(cleanChips.join(', '), MAX_TEXT_LENGTH);
  }
  return cleanNote;
}

/**
 * Builds the canonical JER-775 feedback payload for submission or offline fallback copy.
 */
export function buildFeedbackPayload(params: {
  app?: string;
  surface: FeedbackSurface;
  itemId: string;
  selectedChips?: readonly string[];
  note: string;
  timestamp?: string;
  itemName?: string;
  url?: string;
  viewport?: string;
}): FeedbackPayload {
  const app = sanitizeSingleLine(params.app || FEEDBACK_APP_ID, MAX_APP_LENGTH) || FEEDBACK_APP_ID;
  const item_id =
    sanitizeSingleLine(params.itemId, MAX_ITEM_ID_LENGTH) ||
    (params.surface === 'header' ? 'global' : 'unknown');
  const text = buildFeedbackText(params.selectedChips ?? [], params.note);
  const timestamp = params.timestamp || new Date().toISOString();

  const payload: FeedbackPayload = {
    app,
    surface: params.surface,
    item_id,
    text,
    timestamp,
  };

  if (params.itemName) {
    const cleanName = sanitizeSingleLine(params.itemName, MAX_ITEM_NAME_LENGTH);
    if (cleanName) payload.item_name = cleanName;
  }
  const safeUrl = sanitizeHttpUrl(params.url);
  if (safeUrl) payload.url = safeUrl;

  if (params.viewport) {
    const cleanViewport = sanitizeSingleLine(params.viewport, MAX_VIEWPORT_LENGTH);
    if (VIEWPORT_RE.test(cleanViewport)) payload.viewport = cleanViewport;
  }

  return payload;
}

/**
 * Validates and sanitizes an incoming feedback payload at the API boundary.
 */
export function validateFeedbackPayload(raw: unknown): ValidationResult {
  if (!isPlainObject(raw)) {
    return { ok: false, error: 'Request body must be a JSON object.' };
  }

  if (typeof raw.app !== 'string') {
    return { ok: false, error: 'Missing required field: app.' };
  }
  const app = sanitizeSingleLine(raw.app);
  if (!APP_SLUG_RE.test(app)) {
    return { ok: false, error: 'Invalid app identifier.' };
  }

  if (typeof raw.surface !== 'string') {
    return { ok: false, error: 'Missing required field: surface.' };
  }
  const surface = sanitizeSingleLine(raw.surface);
  if (!ALLOWED_SURFACES.has(surface)) {
    return { ok: false, error: 'Invalid surface. Expected "venue-card" or "header".' };
  }

  if (typeof raw.item_id !== 'string') {
    return { ok: false, error: 'Missing required field: item_id.' };
  }
  const item_id = sanitizeSingleLine(raw.item_id);
  if (!item_id) {
    return { ok: false, error: 'item_id cannot be empty.' };
  }
  if (item_id.length > MAX_ITEM_ID_LENGTH) {
    return { ok: false, error: `item_id exceeds ${MAX_ITEM_ID_LENGTH} characters.` };
  }

  if (typeof raw.text !== 'string') {
    return { ok: false, error: 'Missing required field: text.' };
  }
  const text = sanitizeMultiline(raw.text);
  if (text.length < MIN_TEXT_LENGTH) {
    return { ok: false, error: 'Please select a quick option or enter a brief note.' };
  }
  if (text.length > MAX_TEXT_LENGTH) {
    return { ok: false, error: `Feedback text exceeds ${MAX_TEXT_LENGTH} characters.` };
  }

  if (typeof raw.timestamp !== 'string') {
    return { ok: false, error: 'Missing required field: timestamp.' };
  }
  const rawTimestamp = sanitizeSingleLine(raw.timestamp, 40);
  const parsedTime = Date.parse(rawTimestamp);
  if (!ISO_DATE_RE.test(rawTimestamp) || !Number.isFinite(parsedTime)) {
    return { ok: false, error: 'Invalid ISO timestamp.' };
  }
  const timestamp = new Date(parsedTime).toISOString();

  const sanitized: FeedbackPayload = {
    app,
    surface: surface as FeedbackSurface,
    item_id,
    text,
    timestamp,
  };

  if (typeof raw.item_name === 'string') {
    const cleanName = sanitizeSingleLine(raw.item_name, MAX_ITEM_NAME_LENGTH);
    if (cleanName) sanitized.item_name = cleanName;
  }

  const safeUrl = sanitizeHttpUrl(raw.url);
  if (safeUrl) sanitized.url = safeUrl;

  if (typeof raw.viewport === 'string') {
    const cleanViewport = sanitizeSingleLine(raw.viewport, MAX_VIEWPORT_LENGTH);
    if (VIEWPORT_RE.test(cleanViewport)) {
      sanitized.viewport = cleanViewport;
    }
  }

  return { ok: true, data: sanitized };
}

export function formatLinearIssueTitle(payload: FeedbackPayload): string {
  const flat = sanitizeSingleLine(payload.text);
  const summary = flat.length > 72 ? `${flat.slice(0, 72).trimEnd()}...` : flat;
  return `[${payload.app}] Improve request: ${summary}`;
}

export function formatLinearIssueBody(payload: FeedbackPayload): string {
  const safeBodyText = payload.text.replace(/```/g, "'''");
  const lines = [
    '## Feedback',
    '',
    safeBodyText,
    '',
    '## Context',
    `- **app:** \`${escapeInlineCode(payload.app)}\``,
    `- **surface:** \`${escapeInlineCode(payload.surface)}\``,
    `- **item_id:** \`${escapeInlineCode(payload.item_id)}\``,
    `- **timestamp:** \`${escapeInlineCode(payload.timestamp)}\``,
  ];

  if (payload.item_name) {
    lines.push(`- **item_name:** ${escapeInlineCode(payload.item_name)}`);
  }
  if (payload.url) {
    lines.push(`- **url:** ${escapeInlineCode(payload.url)}`);
  }
  if (payload.viewport) {
    lines.push(`- **viewport:** \`${escapeInlineCode(payload.viewport)}\``);
  }

  lines.push('', 'Filed from the in-app Improve / Flag button.');
  return lines.join('\n');
}

export function formatReportForCopy(payload: FeedbackPayload): string {
  const lines = [
    formatLinearIssueTitle(payload),
    `app: ${payload.app}`,
    `surface: ${payload.surface}`,
    `item_id: ${payload.item_id}`,
  ];
  if (payload.item_name) {
    lines.push(`item_name: ${payload.item_name}`);
  }
  lines.push(`timestamp: ${payload.timestamp}`);
  if (payload.url) {
    lines.push(`url: ${payload.url}`);
  }
  lines.push('', payload.text);
  return lines.join('\n');
}
