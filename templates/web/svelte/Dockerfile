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

# The Vite dev server (vite dev), which `seamless verify` also drives.
FROM deps AS dev
# .env stays out of the image, so the dev server gets the scaffolded stack's API
# origin here. Override it with -e VITE_API_URL=... for another API.
ENV VITE_API_URL=http://localhost:3000/
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173", "--strictPort"]

FROM deps AS builder
RUN npm run build

FROM nginx:alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/build /usr/share/nginx/html
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
EXPOSE 80
HEALTHCHECK CMD wget --no-verbose --tries=1 --spider http://127.0.0.1/health || exit 1
CMD ["/entrypoint.sh"]
