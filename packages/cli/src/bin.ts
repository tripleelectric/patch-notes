#!/usr/bin/env node
import { run } from './run.js'

run(process.argv.slice(2), {
  cwd: process.cwd(),
  stdout: (line) => process.stdout.write(`${line}\n`),
  stderr: (line) => process.stderr.write(`${line}\n`),
  now: () => new Date(),
  env: process.env,
}).then(
  (code) => {
    process.exitCode = code
  },
  (error: unknown) => {
    process.stderr.write(`patchnotes: ${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  },
)
