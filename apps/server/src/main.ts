import { buildApp } from './app.js'
import { loadConfig } from './config.js'

const config = loadConfig(process.env)
if (!config.ok) {
  for (const error of config.errors) console.error(`config: ${error}`)
  process.exit(1)
}

const app = await buildApp(config.value, { logger: true })
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => void app.close().then(() => process.exit(0)))
}
await app.listen({ port: config.value.port, host: config.value.host })
