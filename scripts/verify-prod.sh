#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${VERIFY_URL:-https://dining-rewards-app.vercel.app}"
BASE_URL="${BASE_URL%/}"

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

PASS_COUNT=0
FAIL_COUNT=0

record_pass() {
  PASS_COUNT=$((PASS_COUNT + 1))
  printf 'PASS  %s\n' "$1"
}

record_fail() {
  FAIL_COUNT=$((FAIL_COUNT + 1))
  printf 'FAIL  %s\n' "$1" >&2
}

run_request() {
  local method="$1"
  local path="$2"
  local body_data="${3:-}"
  local hdr_file="$4"
  local body_file="$5"
  local err_file="$6"
  local code

  : > "$hdr_file"
  : > "$body_file"
  : > "$err_file"

  if [ -n "$body_data" ]; then
    code="$(curl -sS --connect-timeout 5 --max-time 8 \
      -X "$method" \
      -H "Content-Type: application/json" \
      -d "$body_data" \
      -D "$hdr_file" \
      -o "$body_file" \
      -w "%{http_code}" \
      "${BASE_URL}${path}" 2>"$err_file" || true)"
  else
    code="$(curl -sS --connect-timeout 5 --max-time 8 \
      -X "$method" \
      -D "$hdr_file" \
      -o "$body_file" \
      -w "%{http_code}" \
      "${BASE_URL}${path}" 2>"$err_file" || true)"
  fi

  printf '%s' "${code:-000}"
}

get_header_value() {
  local hdr_file="$1"
  local header_name="$2"
  node -e '
    const fs = require("fs");
    const raw = fs.readFileSync(process.argv[1], "utf8");
    const target = process.argv[2].toLowerCase();
    const lines = raw.split(/\r?\n/);
    let value = "";
    for (const line of lines) {
      const idx = line.indexOf(":");
      if (idx > 0 && line.slice(0, idx).trim().toLowerCase() === target) {
        value = line.slice(idx + 1).trim();
      }
    }
    process.stdout.write(value);
  ' "$hdr_file" "$header_name"
}

is_valid_json_error() {
  local body_file="$1"
  node -e '
    const fs = require("fs");
    const raw = fs.readFileSync(process.argv[1], "utf8");
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      process.exit(1);
    }
    if (parsed.ok !== false || typeof parsed.error !== "string") {
      process.exit(1);
    }
  ' "$body_file" >/dev/null 2>&1
}

format_failure_detail() {
  local body_file="$1"
  local err_file="$2"
  if [ -s "$err_file" ]; then
    head -c 200 "$err_file" | tr '\n' ' '
  elif [ -s "$body_file" ]; then
    head -c 200 "$body_file" | tr '\n' ' '
  else
    printf 'empty response'
  fi
}

printf 'Verifying dining-rewards-app at %s\n' "$BASE_URL"

# 1. GET / -> HTTP 200 + <div id="root" (not Vercel error page)
h1="$TMP_DIR/h1.txt"
b1="$TMP_DIR/b1.txt"
e1="$TMP_DIR/e1.txt"
s1="$(run_request GET "/" "" "$h1" "$b1" "$e1")"
if [ "$s1" = "200" ] && grep -q '<div id="root"' "$b1" && ! grep -qE 'FUNCTION_INVOCATION_FAILED|MIDDLEWARE_INVOCATION_FAILED' "$b1"; then
  record_pass "GET / -> HTTP $s1 with <div id=\"root\""
else
  record_fail "GET / -> expected HTTP 200 with <div id=\"root\", got HTTP $s1 ($(format_failure_detail "$b1" "$e1"))"
fi

# 2. GET /sw.js -> HTTP 200 + Cache-Control has no-cache or no-store
h2="$TMP_DIR/h2.txt"
b2="$TMP_DIR/b2.txt"
e2="$TMP_DIR/e2.txt"
s2="$(run_request GET "/sw.js" "" "$h2" "$b2" "$e2")"
cc2="$(get_header_value "$h2" "cache-control" | tr '[:upper:]' '[:lower:]')"
if [ "$s2" = "200" ] && printf '%s' "$cc2" | grep -qE 'no-cache|no-store'; then
  record_pass "GET /sw.js -> HTTP $s2 (Cache-Control: $cc2)"
else
  record_fail "GET /sw.js -> expected HTTP 200 with Cache-Control no-cache/no-store, got HTTP $s2 (Cache-Control: ${cc2:-<missing>}; $(format_failure_detail "$b2" "$e2"))"
fi

# 3. GET /api/feedback -> HTTP 405 + application/json
h3="$TMP_DIR/h3.txt"
b3="$TMP_DIR/b3.txt"
e3="$TMP_DIR/e3.txt"
s3="$(run_request GET "/api/feedback" "" "$h3" "$b3" "$e3")"
ct3="$(get_header_value "$h3" "content-type" | tr '[:upper:]' '[:lower:]')"
if [ "$s3" = "405" ] && printf '%s' "$ct3" | grep -q 'application/json' && is_valid_json_error "$b3"; then
  record_pass "GET /api/feedback -> HTTP $s3 ($ct3)"
else
  record_fail "GET /api/feedback -> expected HTTP 405 JSON, got HTTP $s3 (${ct3:-<missing>}): $(format_failure_detail "$b3" "$e3")"
fi

# 4. POST /api/feedback with {} -> HTTP 400 + application/json (validation without calling Linear)
h4="$TMP_DIR/h4.txt"
b4="$TMP_DIR/b4.txt"
e4="$TMP_DIR/e4.txt"
s4="$(run_request POST "/api/feedback" "{}" "$h4" "$b4" "$e4")"
ct4="$(get_header_value "$h4" "content-type" | tr '[:upper:]' '[:lower:]')"
if [ "$s4" = "400" ] && printf '%s' "$ct4" | grep -q 'application/json' && is_valid_json_error "$b4"; then
  record_pass "POST /api/feedback {} -> HTTP $s4 ($ct4)"
else
  record_fail "POST /api/feedback {} -> expected HTTP 400 JSON, got HTTP $s4 (${ct4:-<missing>}): $(format_failure_detail "$b4" "$e4")"
fi

printf 'Summary: %d passed, %d failed\n' "$PASS_COUNT" "$FAIL_COUNT"
if [ "$FAIL_COUNT" -ne 0 ]; then
  exit 1
fi
