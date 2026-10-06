# Next.js standalone output: a self-contained server with only the
# dependencies it uses, so the image carries no node_modules of its own.
FROM node:24-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:24-slim
WORKDIR /app
ENV NODE_ENV=production
# Port 80 and /health are what the generated compose file expects of the web
# container.
ENV PORT=80
ENV HOSTNAME=0.0.0.0

COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

EXPOSE 80
HEALTHCHECK CMD node -e "fetch('http://localhost/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
