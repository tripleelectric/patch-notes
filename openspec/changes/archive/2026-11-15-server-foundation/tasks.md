# Tasks

## 1. App setup

- [x] 1.1 Create `apps/server` (package.json, tsconfig with `jsx: react-jsx`, `jsxImportSource: @kitajs/html`, ts-html-plugin) and allow install scripts for `better-sqlite3`, `prisma` and `@prisma/engines`; verify `pnpm install && pnpm typecheck` passes
- [x] 1.2 Implement env config parsing with zod (`DATA_DIR`, `PORT`, `HOST`, `BASE_URL`); verify tests for missing `BASE_URL` and defaults

## 2. Database

- [x] 2.1 Add Prisma 7 schema and config with the better-sqlite3 adapter, client output `src/generated/prisma`, and the in-process migration runner; verify a test that starts twice on one `DATA_DIR` and keeps data
- [x] 2.2 Implement `buildApp(config)` creating `DATA_DIR`, migrating, and `GET /healthz`; verify tests for fresh directory and healthy response

## 3. Pages and assets

- [x] 3.1 Add `Layout`, Tailwind build, htmx copy, static serving under `/assets/` and security headers; verify a test that a page references both assets, both return `200`, and the headers are set

## 4. Container

- [x] 4.1 Add `Dockerfile` and `.dockerignore`; verify `docker build` succeeds and a container with a `/data` volume answers `GET /healthz` with `200`

## 5. Integration

- [x] 5.1 Run `pnpm typecheck && pnpm test && pnpm build` and `openspec validate server-foundation --strict`; verify all pass
