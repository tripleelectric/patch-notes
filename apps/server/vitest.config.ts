import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'server',
    globalSetup: ['./test/global-setup.ts'],
  },
})
