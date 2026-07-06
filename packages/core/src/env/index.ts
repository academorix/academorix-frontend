/**
 * @file index.ts
 * @module @academorix/core/env
 *
 * @description
 * Public barrel for the env-reader primitives. Two helpers:
 *
 *  - {@link env} — a global reader that probes `import.meta.env` and
 *    `process.env` at call time. Works cross-runtime; less optimal
 *    because build tools can't inline the values.
 *
 *  - {@link createEnvReader} — factory that takes a caller-provided
 *    `read(key)` closure. The closure lives in the caller's build unit
 *    so Vite / Next.js can do their build-time env substitution as
 *    usual. Preferred pattern for app-side env.config.ts files.
 */

export { createEnvReader, env } from "./env.util";
