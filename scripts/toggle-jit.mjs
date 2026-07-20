#!/usr/bin/env node
/**
 * @file toggle-jit.mjs
 * @module scripts/toggle-jit
 * @description Switches all workspace packages between JIT and compiled modes.
 *
 *   JIT mode (development):
 *   - exports point directly to TypeScript source files
 *   - No build step required — bundlers/runtimes consume .ts directly
 *   - Faster iteration, instant changes, no dist/ staleness
 *
 *   Compiled mode (production/CI):
 *   - exports point to dist/ with types, ESM (.js), and CJS (.cjs) outputs
 *   - Requires `yarn build` (tsup) before consumption
 *   - Optimized, tree-shakeable, publishable
 *
 *   ## Usage
 *
 *   ```bash
 *   yarn jit               # JIT mode: source exports + rewrite @/ → relative
 *   yarn compile           # Compiled mode: dist exports + rewrite relative → @/
 *   yarn jit --check       # Report current mode without changing
 *   yarn jit --no-rewrite  # Only flip exports, don't touch @/ imports
 *   yarn jit --rewrite-only # Only rewrite @/ ↔ relative, don't touch exports
 *   yarn jit --filter cache  # Only toggle a specific package
 *   ```
 *
 *   ## How it works
 *
 *   For each package the script does TWO things (both opt-out via
 *   `--no-rewrite`):
 *
 *   1. Rewrites the `"exports"` field in package.json:
 *
 *      JIT:
 *        ".": "./src/index.ts"
 *
 *      Compiled (tsup dual CJS+ESM):
 *        ".": { "types": "./dist/index.d.ts",
 *               "import": "./dist/index.js",
 *               "require": "./dist/index.cjs" }
 *
 *   2. Rewrites every `@/...` import in `src/**\/*.{ts,tsx}` so source
 *      code matches the active mode:
 *
 *      - JIT mode → `@/utils` becomes `../utils` (or whatever the
 *        relative path is from the file). Necessary because runtime
 *        TypeScript loaders (SWC register hook, Node --require, etc.)
 *        only know ONE `.swcrc` / tsconfig at a time — they cannot
 *        resolve per-package `@/*` aliases across workspace boundaries.
 *
 *      - Compiled mode → relative imports inside the same `src/` tree
 *        become `@/foo`. Restores the developer-friendly alias once
 *        each package builds standalone via tsup.
 *
 *   Test files under `__tests__/` are NOT rewritten — Vitest resolves
 *   `@/*` via `vite-tsconfig-paths` independently of the JIT/compile
 *   toggle.
 */

import { readdirSync, existsSync, writeFileSync, readFileSync } from "node:fs";
import { join, relative, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const PACKAGES = join(ROOT, "packages");

// ── CLI args ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const mode = args.includes("--compiled") ? "compiled" : "jit";
const checkOnly = args.includes("--check");
const rewriteOnly = args.includes("--rewrite-only");
/**
 * When set, the script flips `package.json` exports but does NOT
 * touch `@/...` imports in the source tree. Use this if you want
 * to manage alias rewriting yourself (or if you've already done it).
 */
const noRewrite = args.includes("--no-rewrite");
const filterIdx = args.indexOf("--filter");
const filterName = filterIdx !== -1 ? args[filterIdx + 1] : null;

// ── Package discovery ───────────────────────────────────────────────────────

function findPackages(dir) {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", "dist", ".DS_Store", ".turbo", "__generated__"].includes(entry.name))
      continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (existsSync(join(full, "package.json"))) {
        results.push(full);
      } else {
        results.push(...findPackages(full));
      }
    }
  }
  return results;
}

/**
 * Pull "custom" exports out of an existing `exports` field — anything
 * the toggle script did NOT author and therefore must not delete.
 *
 * A custom export is any entry whose value:
 *
 *   - Is a STRING that does not look like a TS source file
 *     (`.css`, `.json`, `.png`, `./README.md`, ...).
 *   - Is a CONDITIONAL OBJECT whose `default` / `import` / `require`
 *     paths point to non-TS files (compiled CSS bundles, JSON, …).
 *
 * Everything else (`.ts` strings, `dist/*.js` conditional objects)
 * is owned by the toggle script and gets regenerated from
 * `detectEntries()` on every run.
 *
 * @param currentExports - The package's existing `exports` object.
 * @returns A map of `{ exportKey: existingValue }` to preserve verbatim.
 */
function extractCustomExports(currentExports) {
  const preserved = {};
  if (!currentExports || typeof currentExports !== "object") return preserved;

  for (const [key, value] of Object.entries(currentExports)) {
    // String value — check if the target looks like TS source / dist JS.
    if (typeof value === "string") {
      if (isSourceOrDistTarget(value)) continue;
      preserved[key] = value;
      continue;
    }

    // Conditional object — check the most authoritative slot.
    if (value && typeof value === "object") {
      const probe = value.default ?? value.import ?? value.require ?? value.types;
      if (typeof probe === "string" && isSourceOrDistTarget(probe)) continue;
      preserved[key] = value;
    }
  }
  return preserved;
}

/**
 * Predicate — does this export target look like a regular TS source
 * file (`.ts`, `.tsx`) or tsup output (`dist/*.{js,cjs,d.ts}`)?
 *
 * If yes, the toggle-jit script owns it and will regenerate on every
 * run. Anything else (CSS, JSON, markdown, native font assets, …)
 * belongs to the package author and must be preserved.
 */
function isSourceOrDistTarget(path) {
  return /\.tsx?$/.test(path) || /\/dist\/.*\.(js|cjs|mjs|d\.ts)$/.test(path);
}

// ── Entry point detection ───────────────────────────────────────────────────

/**
 * Detects source entry points for a package.
 *
 * Strategy (in priority order):
 * 1. Read tsup.config.ts and extract the entry map (source of truth)
 * 2. Read existing package.json exports and reverse-map to source files
 * 3. Fall back to directory structure heuristics
 *
 * Returns a map of export key → source file path.
 */
function detectEntries(pkgDir) {
  // Strategy 1: Read tsup.config.ts entries
  const tsupEntries = readTsupEntries(pkgDir);
  if (tsupEntries && Object.keys(tsupEntries).length > 0) {
    // Convert tsup entry names to export keys: "index" → ".", "react" → "./react"
    const entries = {};
    for (const [name, source] of Object.entries(tsupEntries)) {
      const key = name === "index" ? "." : `./${name}`;
      entries[key] = source.startsWith("./") ? source : `./${source}`;
    }
    return entries;
  }

  // Strategy 2: Fall back to directory structure heuristics
  return detectEntriesFromStructure(pkgDir);
}

/**
 * Parse tsup.config.ts and extract the entry map.
 * Returns { index: 'src/index.ts', react: 'src/react/index.ts', ... } or null.
 */
function readTsupEntries(pkgDir) {
  const configPath = join(pkgDir, "tsup.config.ts");
  if (!existsSync(configPath)) return null;

  try {
    const content = readFileSync(configPath, "utf8");
    // Extract the entry object using regex (simple but covers all generated configs)
    const entryMatch = content.match(/entry:\s*\{([^}]+)\}/s);
    if (!entryMatch) return null;

    const entries = {};
    // Match lines like: "index": "src/index.ts",  or  index: 'src/index.ts',
    const lineRegex = /["']?(\w+)["']?\s*:\s*["']([^"']+)["']/g;
    let match;
    while ((match = lineRegex.exec(entryMatch[1])) !== null) {
      entries[match[1]] = match[2];
    }
    return Object.keys(entries).length > 0 ? entries : null;
  } catch {
    return null;
  }
}

/**
 * Fallback: detect entries from src/ directory structure.
 * Handles all package layouts:
 * - Platform (core/react/nestjs/native/vite/testing)
 * - Domain (shared/api/web/native)
 * - Flat infra (just src/index.ts)
 */
function detectEntriesFromStructure(pkgDir) {
  const entries = {};

  // Standard subpaths to check for any package
  const SUBPATHS = ["core", "react", "nestjs", "native", "vite", "testing", "ssr"];

  // Unified platform packages: src/core/, src/react/, src/nestjs/, etc.
  if (existsSync(join(pkgDir, "src/core/index.ts"))) {
    entries["."] = "./src/core/index.ts";
    for (const sub of SUBPATHS) {
      if (sub === "core") continue;
      if (existsSync(join(pkgDir, `src/${sub}/index.ts`))) {
        entries[`./${sub}`] = `./src/${sub}/index.ts`;
      }
    }
    return entries;
  }

  // Full-stack domain/app packages: src/shared/, src/api/, src/web/, src/native/
  if (existsSync(join(pkgDir, "src/shared/index.ts"))) {
    if (existsSync(join(pkgDir, "src/index.ts"))) {
      entries["."] = "./src/index.ts";
    } else {
      entries["."] = "./src/shared/index.ts";
    }
    entries["./shared"] = "./src/shared/index.ts";
    if (existsSync(join(pkgDir, "src/api/index.ts"))) entries["./api"] = "./src/api/index.ts";
    if (existsSync(join(pkgDir, "src/web/index.ts"))) entries["./web"] = "./src/web/index.ts";
    if (existsSync(join(pkgDir, "src/native/index.ts")))
      entries["./native"] = "./src/native/index.ts";
    return entries;
  }

  // Flat infra packages or simple packages: src/index.ts + optional subpaths
  if (existsSync(join(pkgDir, "src/index.ts"))) {
    entries["."] = "./src/index.ts";
    // Check for additional subpaths even in flat packages
    for (const sub of SUBPATHS) {
      if (existsSync(join(pkgDir, `src/${sub}/index.ts`))) {
        entries[`./${sub}`] = `./src/${sub}/index.ts`;
      }
    }
    return entries;
  }

  return entries;
}

/**
 * Converts source entries to compiled exports format (tsup output).
 * tsup preserves directory structure: src/core/index.ts → dist/core/index.js
 *
 * Native subpaths always point to source (consumed by Metro JIT).
 */
function toCompiledExports(entries) {
  const exports = {};

  for (const [key, srcPath] of Object.entries(entries)) {
    // Native subpath always points to source (JIT by Metro)
    if (key === "./native") {
      exports[key] = {
        types: srcPath,
        import: srcPath,
        default: srcPath,
      };
      continue;
    }

    // Convert source path to dist path: ./src/core/index.ts → ./dist/core/index
    const distBase = srcPath
      .replace("./src/", "./dist/")
      .replace("/index.ts", "/index")
      .replace(".ts", "");

    exports[key] = {
      types: `${distBase}.d.ts`,
      import: `${distBase}.js`,
      require: `${distBase}.cjs`,
    };
  }

  return exports;
}

/**
 * Converts source entries to JIT exports format.
 * /vite subpaths always stay compiled (loaded by Node before Vite starts).
 */
function toJitExports(entries) {
  const exports = {};
  for (const [key, srcPath] of Object.entries(entries)) {
    exports[key] = srcPath;
  }
  return exports;
}

// ── Import path rewriting ───────────────────────────────────────────────────

/**
 * Recursively find all .ts/.tsx files in a directory.
 */
function findSourceFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", "dist", ".turbo", "__generated__", "__tests__"].includes(entry.name))
      continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findSourceFiles(full));
    } else if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith(".d.ts")) {
      results.push(full);
    }
  }
  return results;
}

/**
 * Resolve the `@/` base path from a package's tsconfig.json.
 */
function resolveAliasBase(pkgDir) {
  const tsconfigPath = join(pkgDir, "tsconfig.json");
  if (!existsSync(tsconfigPath)) return join(pkgDir, "src");
  try {
    const raw = readFileSync(tsconfigPath, "utf8")
      .replace(/\/\/.*$/gm, "")
      .replace(/\/\*[\s\S]*?\*\//g, "");
    const tsconfig = JSON.parse(raw);
    const paths = tsconfig?.compilerOptions?.paths;
    if (paths && paths["@/*"]) {
      const mapped = paths["@/*"][0];
      const base = mapped.replace("/*", "").replace("./", "");
      return join(pkgDir, base);
    }
  } catch {
    /* fallback */
  }
  return join(pkgDir, "src");
}

/**
 * Convert `@/` imports to relative paths in a source file.
 */
function convertAliasToRelative(filePath, aliasBase) {
  const content = readFileSync(filePath, "utf8");
  const fileDir = dirname(filePath);

  const aliasRegex = /(['"])@\/([^'"]+)\1/g;
  if (!aliasRegex.test(content)) return false;

  const updated = content.replace(/(['"])@\/([^'"]+)\1/g, (match, quote, importPath) => {
    const absoluteTarget = join(aliasBase, importPath);
    let relativePath = relative(fileDir, absoluteTarget);
    relativePath = relativePath.split("\\").join("/");
    if (!relativePath.startsWith(".")) {
      relativePath = "./" + relativePath;
    }
    return `${quote}${relativePath}${quote}`;
  });

  if (updated !== content) {
    writeFileSync(filePath, updated);
    return true;
  }
  return false;
}

/**
 * Convert relative imports back to `@/` path aliases.
 */
function convertRelativeToAlias(filePath, aliasBase) {
  const content = readFileSync(filePath, "utf8");
  const fileDir = dirname(filePath);

  const relativeRegex = /(['"])(\.\.?\/[^'"]+)\1/g;

  let modified = false;
  const updated = content.replace(relativeRegex, (match, quote, importPath) => {
    const absoluteTarget = resolve(fileDir, importPath);
    const relToBase = relative(aliasBase, absoluteTarget);
    if (relToBase.startsWith("..") || relToBase.startsWith("/")) {
      return match;
    }
    const aliasPath = "@/" + relToBase.split("\\").join("/");
    modified = true;
    return `${quote}${aliasPath}${quote}`;
  });

  if (modified) {
    writeFileSync(filePath, updated);
    return true;
  }
  return false;
}

/**
 * Rewrite imports for a package: @/ → relative (JIT) or relative → @/ (compiled).
 */
function rewriteImports(pkgDir, targetMode) {
  const srcDir = join(pkgDir, "src");
  if (!existsSync(srcDir)) return 0;

  const aliasBase = resolveAliasBase(pkgDir);
  const files = findSourceFiles(srcDir);
  let count = 0;

  for (const file of files) {
    if (targetMode === "jit") {
      if (convertAliasToRelative(file, aliasBase)) count++;
    } else {
      if (convertRelativeToAlias(file, aliasBase)) count++;
    }
  }

  return count;
}

// ── Main ────────────────────────────────────────────────────────────────────

const packages = findPackages(PACKAGES);
let switched = 0;
let alreadyCorrect = 0;
let skipped = 0;

// ── Clean stale artifacts when switching modes ──────────────────────────────
if (!checkOnly && !rewriteOnly) {
  const { execSync } = await import("node:child_process");
  console.log("🧹 Cleaning dist/ and .turbo/ caches...");
  try {
    execSync(
      'find packages/ -name "dist" -type d -not -path "*/node_modules/*" -not -path "*/.ref/*" -exec rm -rf {} + 2>/dev/null',
      { cwd: ROOT, stdio: "pipe" },
    );
  } catch {}
  try {
    execSync(
      'find packages/ apps/ -name ".turbo" -type d -not -path "*/node_modules/*" -exec rm -rf {} + 2>/dev/null',
      { cwd: ROOT, stdio: "pipe" },
    );
  } catch {}
  try {
    execSync("rm -rf .turbo 2>/dev/null", { cwd: ROOT, stdio: "pipe" });
  } catch {}
  console.log("  ✓ Cleaned\n");
}

console.log(
  `\n${checkOnly ? "🔍 Checking" : rewriteOnly ? "🔄 Rewriting imports only" : mode === "jit" ? "⚡ Switching to JIT" : "📦 Switching to Compiled"} — ${packages.length} packages\n`,
);

// ─── Rewrite-only mode ──────────────────────────────────────────────────────
if (rewriteOnly) {
  let totalFiles = 0;
  for (const pkgDir of packages) {
    const pkg = JSON.parse(readFileSync(join(pkgDir, "package.json"), "utf8"));
    const rel = relative(PACKAGES, pkgDir);
    if (filterName && !rel.includes(filterName) && pkg.name !== filterName) continue;

    const count = rewriteImports(pkgDir, mode);
    if (count > 0) {
      console.log(`  ${mode === "jit" ? "⚡" : "📦"} ${rel} — ${count} file(s) rewritten`);
      totalFiles += count;
    }
  }
  console.log(`\n  Total files rewritten: ${totalFiles}\n`);
  process.exit(0);
}

for (const pkgDir of packages) {
  const pkgPath = join(pkgDir, "package.json");
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
  const rel = relative(PACKAGES, pkgDir);

  // Apply filter
  if (filterName && !rel.includes(filterName) && pkg.name !== filterName) {
    skipped++;
    continue;
  }

  // Skip packages without detectable entries
  const entries = detectEntries(pkgDir);
  if (Object.keys(entries).length === 0) {
    skipped++;
    continue;
  }

  // Determine target exports
  const generatedExports = mode === "jit" ? toJitExports(entries) : toCompiledExports(entries);
  // Preserve any export the toggle script didn't author — CSS files,
  // JSON manifests, font assets, etc. These are package-author-owned
  // and must survive every mode flip.
  const preservedExports = extractCustomExports(pkg.exports);
  const targetExports = { ...generatedExports, ...preservedExports };

  // Check if already in target mode
  const currentExportsStr = JSON.stringify(pkg.exports);
  const targetExportsStr = JSON.stringify(targetExports);

  if (currentExportsStr === targetExportsStr) {
    alreadyCorrect++;
    // Still run the import rewrite so the script is idempotent —
    // a new file authored with `@/foo` after `yarn jit` would
    // otherwise stay broken until exports also drift.
    if (!checkOnly && !noRewrite) {
      const rewrittenCount = rewriteImports(pkgDir, mode);
      if (rewrittenCount > 0) {
        console.log(
          `  ${mode === "jit" ? "⚡" : "📦"} ${rel} (${pkg.name}) — ${rewrittenCount} file(s) rewritten (exports already correct)`,
        );
      }
    }
    continue;
  }

  if (checkOnly) {
    const isCurrentlyJit = typeof Object.values(pkg.exports || {})[0] === "string";
    console.log(
      `  ${isCurrentlyJit ? "⚡" : "📦"} ${rel} (${pkg.name}) — ${isCurrentlyJit ? "JIT" : "compiled"}`,
    );
    switched++;
    continue;
  }

  // Apply change
  pkg.exports = targetExports;

  if (mode === "jit") {
    // JIT mode: point main/types to source, no build needed
    pkg.main = entries["."];
    pkg.module = entries["."];
    pkg.types = entries["."];
    if (pkg.scripts) {
      pkg.scripts.build = 'echo "⚡ JIT mode — skipping build"';
      pkg.scripts.dev = 'echo "⚡ JIT mode — no watch needed"';
    }
  } else {
    // Compiled mode: point to SWC output
    const entryName = "index";
    pkg.main = `./dist/${entryName}.js`;
    pkg.module = `./dist/${entryName}.js`;
    pkg.types = `./dist/${entryName}.d.ts`;
    if (pkg.scripts) {
      // Calculate relative path to root .swcrc
      const depth = relative(PACKAGES, pkgDir).split("/").length + 1; // +1 for 'packages/'
      const rootPrefix = "../".repeat(depth);
      pkg.scripts.build = "npx tsup";
      pkg.scripts.dev = "npx tsup --watch";
    }
  }

  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
  switched++;

  // ── Rewrite @/ ↔ relative imports in the source tree ──────────────────
  // SWC register hooks (and Node --require loaders) cannot resolve
  // per-package `@/*` aliases across workspace boundaries — they only
  // see ONE `.swcrc` / tsconfig at a time, the consumer's. So in JIT
  // mode every workspace source file must speak in relative imports.
  // In compiled mode the source is built by tsup per-package, which
  // does resolve `@/*` correctly, so we can restore the dev-friendly
  // alias for ergonomic editing.
  //
  // Pass `--no-rewrite` to skip this step (you'll need to manage
  // aliases yourself).
  if (!noRewrite) {
    const rewrittenCount = rewriteImports(pkgDir, mode);
    if (rewrittenCount > 0) {
      console.log(
        `  ${mode === "jit" ? "⚡" : "📦"} ${rel} (${pkg.name}) — ${rewrittenCount} file(s) rewritten`,
      );
    }
  }
}

// ── Summary ─────────────────────────────────────────────────────────────────

console.log(`
─────────────────────────────────────────
Summary
─────────────────────────────────────────
  Mode:            ${mode.toUpperCase()}
  ${checkOnly ? "Would switch" : "Switched"}:     ${switched}
  Already correct: ${alreadyCorrect}
  Skipped:         ${skipped}
  Total:           ${packages.length}
`);

if (!checkOnly && switched > 0) {
  console.log(
    mode === "jit"
      ? `⚡ JIT mode active — no build needed, source consumed directly.${noRewrite ? "" : "\n   @/* imports rewritten to relative paths so SWC / Node require hooks can resolve them."}\n`
      : `📦 Compiled mode active — run \`yarn build\` (tsup) to generate dist/.${noRewrite ? "" : "\n   Relative imports inside src/ rewritten back to @/* aliases."}\n`,
  );
}
