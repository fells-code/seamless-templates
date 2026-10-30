# `seamless verify` builds this image with an `sdk` build context holding local
# @seamless-auth tarballs, which replaces the empty stage below. Every other build
# (docker compose in a scaffolded project included) uses the versions in
# package-lock.json.
FROM scratch AS sdk

FROM node:24-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY --from=sdk . /tmp/sdk/
RUN if ls /tmp/sdk/*.tgz >/dev/null 2>&1; then \
      npm install --no-save /tmp/sdk/*.tgz; \
    fi
COPY . .

# The Angular dev server, which `seamless verify` also drives.
FROM deps AS dev
# .env stays out of the image, so `npm run dev` writes the scaffolded stack's API
# origin into config.js from here. Override it with -e API_URL=... for another API.
ENV API_URL=http://localhost:3000/
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

FROM deps AS builder
RUN npm run build

# Unprivileged nginx runs as user nginx (uid 101) and listens on 8080, so the
# container needs neither root nor a privileged port.
FROM nginxinc/nginx-unprivileged:alpine AS runtime
USER root
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist/web/browser /usr/share/nginx/html
COPY entrypoint.sh /entrypoint.sh
# The entrypoint writes config.js into the web root at start.
RUN chmod +x /entrypoint.sh \
  && chown -R nginx:nginx /usr/share/nginx/html
USER nginx
EXPOSE 8080
HEALTHCHECK CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:8080/health || exit 1
CMD ["/entrypoint.sh"]
