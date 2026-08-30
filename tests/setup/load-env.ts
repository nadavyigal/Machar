// Loads .env.local before any test file's module-level code runs, so
// `pnpm test` works without hand-exporting the Supabase env vars
// (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
// SUPABASE_SERVICE_ROLE_KEY) that tests/rls/policies.test.ts reads at
// import time.
//
// Uses Node's built-in `process.loadEnvFile` (stable since Node 20.12 /
// 21.7, well within this repo's pinned Node 22) instead of the `dotenv`
// package -- the approved dependency list is closed and dotenv isn't on
// it. `--env-file` on the CLI was considered too, but the vitest binary
// pnpm installs is a POSIX shell shim (node_modules/.bin/vitest), not a
// JS entrypoint, so `node --env-file=.env.local node_modules/.bin/vitest`
// doesn't work without extra indirection. A vitest setupFile is simpler:
// it runs once per worker before test files are evaluated, needs no
// change to how `pnpm test` is invoked, and works the same under any
// test runner front-end (watch mode, IDE integration, CI).
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const envPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../.env.local')

try {
  process.loadEnvFile(envPath)
} catch (err) {
  // .env.local is gitignored and won't exist in CI environments that
  // inject the same variables directly -- only re-throw real failures.
  if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err
}
