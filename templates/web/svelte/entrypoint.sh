#!/bin/sh
set -eu

API_URL="${API_URL:-}"

cat <<CONFIG > /usr/share/nginx/html/config.js
window.__SEAMLESS_CONFIG__ = {
  API_URL: "${API_URL}",
};
CONFIG

# The CSP's connect-src needs the API's origin. Anything that does not parse as
# an http(s) origin adds nothing, which leaves the API reachable only when it is
# served from this origin.
api_origin="$(printf '%s' "${API_URL}" | sed -nE 's#^(https?://([A-Za-z0-9.-]+|\[[0-9A-Fa-f:.]+\])(:[0-9]+)?)([/?#].*)?$#\1#p')"
script_hashes="$(cat /etc/nginx/seamless/script-hashes 2>/dev/null || true)"

sed \
  -e "s#__API_ORIGIN__#${api_origin:+ ${api_origin}}#" \
  -e "s#__SCRIPT_HASHES__#${script_hashes:+ ${script_hashes}}#" \
  /etc/nginx/seamless/security-headers.conf.template \
  > /etc/nginx/seamless/security-headers.conf

exec nginx -g "daemon off;"
