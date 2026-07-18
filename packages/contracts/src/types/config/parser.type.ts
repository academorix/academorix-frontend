/**
 * @file parser.type.ts
 * @module @stackra/contracts/types/config
 * @description Signature of the parser used by `ConfigModule.forRoot`
 *   to turn an env-file buffer into a flat record.
 *
 * @derived @nestjs/config@4.0.4 — lib/types/parser.type.ts (MIT, © Kamil Myśliwiec)
 */

/**
 * Parser that converts an env-file buffer or string into a flat map
 * of environment variables.
 *
 * The default (Node-only) parser wraps `dotenv`, but `ConfigModule`
 * accepts any function matching this shape — consumers can swap in a
 * YAML / TOML / custom parser. In browser runtimes, no env-file
 * parser runs.
 *
 * @publicApi
 */
export type Parser = (source: Buffer | string) => Record<string, string>;
