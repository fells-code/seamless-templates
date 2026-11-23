#!/bin/sh
set -eu

API_URL="${API_URL:-}"

cat <<CONFIG > /usr/share/nginx/html/config.js
window.__SEAMLESS_CONFIG__ = {
  API_URL: "${API_URL}",
};
CONFIG

# The security headers, which nginx.conf includes in the server block and in
# every location that sets its own add_header (nginx drops inherited add_header
# directives in any location that declares one). They are written here rather
# than shipped as a file because only nginx.conf and this script are certain to
# be in the image, and under /tmp because it is the one path the unprivileged
# nginx image always lets this user write.
#
# connect-src gets the API's origin from API_URL. Anything that does not parse
# as an http(s) origin adds nothing, which leaves the API reachable only when it
# is served from this origin. script-src gets the hashes of any inline scripts
# the build wrote into its HTML, which an image lists in
# /etc/nginx/csp-script-hashes. style-src allows inline styles because the SDK
# and the frameworks inject <style> elements at runtime.
api_origin="$(printf '%s' "${API_URL}" | sed -nE 's#^(https?://([A-Za-z0-9.-]+|\[[0-9A-Fa-f:.]+\])(:[0-9]+)?)([/?#].*)?$#\1#p')"
script_hashes="$(cat /etc/nginx/csp-script-hashes 2>/dev/null || true)"

csp="default-src 'self'; script-src 'self'${script_hashes:+ ${script_hashes}}; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'${api_origin:+ ${api_origin}}; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'"

cat <<HEADERS > /tmp/security-headers.conf
add_header Content-Security-Policy "${csp}" always;
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
HEADERS

exec nginx -g "daemon off;"
