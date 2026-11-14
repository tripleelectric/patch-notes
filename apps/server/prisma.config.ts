import { defineConfig } from 'prisma/config'

// Only used for authoring migrations (`pnpm db:migration <name>`); the server applies them itself on startup.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: process.env.DATABASE_URL ?? 'file:./tmp/migrations.db' },
})
