#!/bin/sh
# Checks that a running web starter sends its security headers on the SPA
# document, both at / and on a deep route that nginx answers with index.html.
#
# Usage: scripts/check-security-headers.sh <base url> <expected API origin>
#   e.g. scripts/check-security-headers.sh http://127.0.0.1:8080 http://localhost:3000
set -eu

base="${1:?base url}"
api_origin="${2:?expected API origin}"
failed=0

check() {
  path="$1"
  headers="$(curl -fsS -D - -o /dev/null "${base}${path}" | tr -d '\r')"

  expect() {
    if ! printf '%s\n' "${headers}" | grep -qi "$1"; then
      echo "FAIL ${path}: missing $2" >&2
      failed=1
    fi
  }

  expect '^content-type: text/html' "an HTML document"
  expect "^x-frame-options: DENY$" "X-Frame-Options: DENY"
  expect '^x-content-type-options: nosniff$' "X-Content-Type-Options: nosniff"
  expect '^referrer-policy: strict-origin-when-cross-origin$' "Referrer-Policy"
  expect "^content-security-policy: .*frame-ancestors 'none'" "CSP frame-ancestors 'none'"
  expect "^content-security-policy: .*connect-src 'self' ${api_origin};" "CSP connect-src for ${api_origin}"
  echo "checked ${path}"
}

check /
check /a/deep/route/the/build/did/not/write

exit "${failed}"
