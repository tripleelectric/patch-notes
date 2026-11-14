# syntax=docker/dockerfile:1
FROM node:22-bookworm-slim AS build
RUN npm install -g pnpm@12.11.2
WORKDIR /repo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/schema/package.json packages/schema/
COPY packages/cli/package.json packages/cli/
COPY apps/server/package.json apps/server/prisma.config.ts apps/server/
COPY apps/server/prisma apps/server/prisma
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter @patch-notes/server build \
  && pnpm --filter @patch-notes/server deploy --prod --legacy /app

FROM node:22-bookworm-slim
ENV NODE_ENV=production DATA_DIR=/data PORT=3000 HOST=0.0.0.0
WORKDIR /app
COPY --from=build /app ./
RUN mkdir -p /data && chown node:node /data
VOLUME /data
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD node -e "fetch('http://127.0.0.1:3000/healthz').then((r) => process.exit(r.ok ? 0 : 1), () => process.exit(1))"
CMD ["node", "dist/server.js"]
