/* eslint-disable no-console -- build script; console output is the contract
 * (dev sees it in their terminal, CI captures it as build log).
 */
/**
 * @file sync-desktop-config.mjs
 * @description
 *   Reads the TypeScript source of truth at `src/config/desktop.config.ts`
 *   and writes a matching JSON snapshot to `src-tauri/desktop-config.json`.
 *   The Rust build script (`src-tauri/build.rs`) consumes that JSON at
 *   compile time to bake window sizing, tray, updater, and logging
 *   constants into the desktop shell binary.
 *
 *   Called automatically by the `tauri:*` pnpm scripts (see
 *   `apps/dashboard/package.json`) so contributors never need to remember
 *   to invoke it manually.
 *
 * ## Why a Node script instead of a Rust deserializer that reads .ts
 *
 * The TypeScript config file uses TS features (interfaces, `satisfies`,
 * `as const`) that a JSON parser cannot understand. Rather than teach the
 * Rust side to run a TypeScript compiler, we snapshot the runtime value
 * to JSON on the JS side and let Rust consume the resulting flat object.
 * Node 24 (matches `.nvmrc`) type-strips imported `.ts` files natively so
 * this script needs zero extra tooling.
 *
 * ## Determinism
 *
 * The output is deterministic — same input, same bytes — so committing
 * the JSON snapshot keeps CI happy (no "dirty tree" surprise on
 * unrelated PRs) and lets `cargo build` skip the rebuild when nothing
 * has changed.
 *
 * ## Failure modes
 *
 * - Missing input file: exit 1 with a clear pointer.
 * - Malformed export (renamed `desktopConfig`): exit 1 with the specific
 *   key that could not be located.
 * - Any write failure: exit 1 with the underlying `fs` error.
 *
 * Non-zero exit fails the pnpm script, which fails `tauri build`, which
 * fails CI. That is the desired behaviour.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const configTs = resolve(scriptDir, "../src/config/desktop.config.ts");
const outJson = resolve(scriptDir, "../src-tauri/desktop-config.json");

// Import the TS module. Node 24 type-strips .ts files by default; on
// Node 22 users would need `--experimental-strip-types`, but the repo's
// `.nvmrc` pins Node 24 (see `frontend/.nvmrc`).
let mod;

try {
  mod = await import(pathToFileURL(configTs).href);
} catch (err) {
  console.error(`[sync-desktop-config] failed to import ${configTs}:`, err);
  process.exit(1);
}

const config = mod.desktopConfig;

if (!config || typeof config !== "object") {
  console.error(
    `[sync-desktop-config] expected a named export 'desktopConfig' in ${configTs}. Got: ${typeof config}`,
  );
  process.exit(1);
}

// Serialize with 2-space indent + trailing newline. Prepend a `$comment`
// key so a curious contributor opening the JSON file sees the
// regeneration instructions without opening this script.
const snapshot = {
  $comment:
    "GENERATED FILE - do not edit by hand. Run 'pnpm --filter @academorix/dashboard sync:desktop-config' to regenerate from src/config/desktop.config.ts. This snapshot is consumed by src-tauri/build.rs at compile time so the Rust shell and the SPA agree on window sizing, tray items, updater endpoint, and security posture.",
  ...JSON.parse(JSON.stringify(config)),
};

try {
  mkdirSync(dirname(outJson), { recursive: true });
  writeFileSync(outJson, `${JSON.stringify(snapshot, null, 2)}\n`);
  console.log(`[sync-desktop-config] wrote ${outJson}`);
} catch (err) {
  console.error(`[sync-desktop-config] failed to write ${outJson}:`, err);
  process.exit(1);
}
