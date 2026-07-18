#!/usr/bin/env node
/**
 * @file migrate-to-catalog.mjs
 * @description
 * One-shot script: scan every live workspace `package.json`, aggregate every
 * pinned dep version, build a single unified `catalog:` block in
 * `pnpm-workspace.yaml`, and rewrite every package's dep specs to `catalog:`
 * (except workspace: refs, which stay as-is).
 *
 * Behavior:
 *  - Aggregates deps from dependencies, devDependencies, peerDependencies,
 *    optionalDependencies across every live workspace package.
 *  - Skips `.ref/`, `packages/old/`, `node_modules/`, `dist/`.
 *  - For each dep observed in more than one package with different versions,
 *    picks the highest observed version.
 *  - Merges observed versions with the existing default `catalog:` from
 *    `pnpm-workspace.yaml` (existing entries win when present).
 *  - Folds any `catalog:<name>` refs (named catalogs) into `catalog:` (default).
 *  - Replaces the default `catalog:` block with a sorted, canonical listing.
 *  - Removes the `catalogs:` (named) block if present.
 *  - Preserves everything else in `pnpm-workspace.yaml` (packages:,
 *    onlyBuiltDependencies:, comments outside the catalog blocks).
 */

import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DEP_SECTIONS = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies",
];

// ---------------------------------------------------------------------------
// 1. Find every live workspace package.json (excludes .ref, packages/old,
//    node_modules, dist)
// ---------------------------------------------------------------------------
const files = execSync(
  `find apps packages -name package.json -not -path '*/node_modules/*' -not -path '*/dist/*'`,
  { encoding: "utf8", cwd: ROOT },
)
  .trim()
  .split("\n")
  .filter(Boolean);

console.log(`▶ scanning ${files.length} package.json files`);

// ---------------------------------------------------------------------------
// 2. Classify + aggregate every dep spec
// ---------------------------------------------------------------------------
function classify(v) {
  if (typeof v !== "string") return { kind: "unknown" };
  if (v.startsWith("workspace:")) return { kind: "workspace", raw: v };
  if (v === "catalog:") return { kind: "catalog", named: null };
  if (v.startsWith("catalog:")) return { kind: "catalog", named: v.slice(8) };
  if (v === "*" || v === "latest") return { kind: "wildcard", raw: v };
  return { kind: "pinned", raw: v };
}

// dep name -> Set<pinned version string>
const observed = new Map();

for (const rel of files) {
  const pkg = JSON.parse(readFileSync(rel, "utf8"));
  for (const section of DEP_SECTIONS) {
    const deps = pkg[section];
    if (!deps) continue;
    for (const [name, v] of Object.entries(deps)) {
      const c = classify(v);
      if (c.kind !== "pinned") continue;
      if (!observed.has(name)) observed.set(name, new Set());
      observed.get(name).add(c.raw);
    }
  }
}

// ---------------------------------------------------------------------------
// 3. Read the existing catalog + catalogs blocks from pnpm-workspace.yaml
// ---------------------------------------------------------------------------
const yamlPath = path.join(ROOT, "pnpm-workspace.yaml");
const yamlRaw = readFileSync(yamlPath, "utf8");

/** Extract a "catalog:" block's entries (name -> version) from raw yaml. */
function parseBlock(yaml, name = "catalog", extraIndent = "") {
  const anchorRe = new RegExp(`^${name}:\\s*$`, "m");
  const anchor = yaml.match(anchorRe);
  if (!anchor) return { entries: new Map(), range: null };

  const start = anchor.index + anchor[0].length;
  const rest = yaml.slice(start);
  // Read lines until we hit a top-level key (line starting with a non-space,
  // non-# char) OR EOF.
  const lines = rest.split("\n");
  const out = new Map();
  let consumed = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    consumed += line.length + 1; // include the newline

    // Stop when we hit a new top-level key
    if (/^\S/.test(line) && !/^\s*$/.test(line) && i > 0) {
      consumed -= line.length + 1; // give this line back
      break;
    }
    if (/^\s*$/.test(line)) continue; // blank
    if (/^\s*#/.test(line)) continue; // comment

    // Match: <indent><name>: <version>   where name may be "quoted"
    const m = line.match(/^(\s+)(?:"([^"]+)"|([^:\s]+))\s*:\s*(.+?)\s*$/);
    if (m) {
      const key = m[2] || m[3];
      const val = m[4];
      out.set(key, val);
    }
  }
  return { entries: out, range: { start: anchor.index, end: start + consumed } };
}

const catalogBlock = parseBlock(yamlRaw, "catalog");
console.log(`▶ existing default catalog: ${catalogBlock.entries.size} entries`);

// Named catalogs: naive parse
const catalogsAnchor = yamlRaw.match(/^catalogs:\s*$/m);
let namedEntries = new Map(); // { catalogName: Map(name -> version) }
let catalogsBlockRange = null;
if (catalogsAnchor) {
  const startIdx = catalogsAnchor.index;
  const rest = yamlRaw.slice(startIdx);
  const lines = rest.split("\n");
  let current = null;
  let consumed = lines[0].length + 1; // consume the "catalogs:" line
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    consumed += line.length + 1;

    // top-level key ends the block
    if (/^\S/.test(line) && !/^\s*$/.test(line) && !/^\s+/.test(line)) {
      consumed -= line.length + 1;
      break;
    }
    if (/^\s*$/.test(line)) continue;
    if (/^\s*#/.test(line)) continue;

    // 2-space indent = named catalog header (e.g. "  react:")
    const catalogName = line.match(/^ {2}([a-zA-Z0-9_-]+):\s*$/);
    if (catalogName) {
      current = catalogName[1];
      namedEntries.set(current, new Map());
      continue;
    }
    // 4-space indent = entry within a named catalog
    const entry = line.match(/^ {4,}(?:"([^"]+)"|([^:\s]+))\s*:\s*(.+?)\s*$/);
    if (entry && current) {
      const key = entry[1] || entry[2];
      const val = entry[3];
      namedEntries.get(current).set(key, val);
    }
  }
  catalogsBlockRange = { start: startIdx, end: startIdx + consumed };
  console.log(`▶ existing named catalogs: ${namedEntries.size}`);
}

// ---------------------------------------------------------------------------
// 4. Build final catalog: existing entries + observed (existing wins),
//    fold named catalogs into default (existing wins).
// ---------------------------------------------------------------------------
function stripPrefix(v) {
  return v.replace(/^[\^~>=<]+\s*/, "");
}

function compareVersions(a, b) {
  const A = stripPrefix(a).split(/[.-]/);
  const B = stripPrefix(b).split(/[.-]/);
  for (let i = 0; i < Math.max(A.length, B.length); i++) {
    const ai = parseInt(A[i]) || 0;
    const bi = parseInt(B[i]) || 0;
    if (ai !== bi) return ai - bi;
  }
  return 0;
}

const finalCatalog = new Map(catalogBlock.entries);

// Seed known phantom refs — deps that are already `catalog:` in every
// package.json (so no pinned version is ever observed) but need a
// catalog entry. Versions match .ref/pixielity/pnpm-workspace.yaml.
const PHANTOM_REFS = {
  "@swc/core": "^1.10.0",
  "@vivtel/metadata": "^1.0.5",
  "eslint-plugin-react-refresh": "^0.4.20",
  "reflect-metadata": "^0.2.2",
  rimraf: "^6.0.1",
  tsup: "^8.5.0",
  "unplugin-swc": "^1.5.9",
};
for (const [name, ver] of Object.entries(PHANTOM_REFS)) {
  if (!finalCatalog.has(name)) finalCatalog.set(name, ver);
}

// Fold named catalogs into default (existing default wins if collision)
for (const [, entries] of namedEntries) {
  for (const [name, ver] of entries) {
    if (!finalCatalog.has(name)) finalCatalog.set(name, ver);
  }
}

// Merge observed (only for entries not already in catalog)
for (const [name, verSet] of observed) {
  if (finalCatalog.has(name)) continue;
  // Pick highest
  const sorted = [...verSet].sort(compareVersions);
  finalCatalog.set(name, sorted.at(-1));
}

console.log(`▶ final catalog: ${finalCatalog.size} entries`);

// ---------------------------------------------------------------------------
// 5. Render + splice new catalog: block into pnpm-workspace.yaml,
//    remove the named catalogs: block.
// ---------------------------------------------------------------------------
function needsQuotes(s) {
  return /[@\/]/.test(s);
}

const sortedEntries = [...finalCatalog.entries()].sort(([a], [b]) => a.localeCompare(b));

const catalogBody = sortedEntries
  .map(([name, ver]) => {
    const key = needsQuotes(name) ? `"${name}"` : name;
    return `  ${key}: ${ver}`;
  })
  .join("\n");

let newYaml = yamlRaw;

// Replace the default catalog: block
if (catalogBlock.range) {
  newYaml =
    newYaml.slice(0, catalogBlock.range.start) +
    `catalog:\n${catalogBody}\n` +
    newYaml.slice(catalogBlock.range.end);
} else {
  // No catalog block existed — append one at the end
  newYaml = newYaml.trimEnd() + `\n\ncatalog:\n${catalogBody}\n`;
}

// Remove the named catalogs: block (its entries were folded into default)
if (catalogsBlockRange) {
  // Recompute range against the new yaml — search fresh since indices shifted
  const stillThere = newYaml.match(/^catalogs:\s*$/m);
  if (stillThere) {
    const lines = newYaml.slice(stillThere.index).split("\n");
    let consumed = lines[0].length + 1;
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (/^\S/.test(line) && !/^\s+/.test(line)) break;
      consumed += line.length + 1;
    }
    newYaml = newYaml.slice(0, stillThere.index) + newYaml.slice(stillThere.index + consumed);
  }
}

// Collapse triple-newlines
newYaml = newYaml.replace(/\n{3,}/g, "\n\n");
if (!newYaml.endsWith("\n")) newYaml += "\n";

writeFileSync(yamlPath, newYaml);
console.log(`✔ wrote pnpm-workspace.yaml`);

// ---------------------------------------------------------------------------
// 6. Rewrite every package.json — swap non-workspace deps to catalog:
// ---------------------------------------------------------------------------
let filesChanged = 0;
let entriesChanged = 0;

for (const rel of files) {
  const absPath = path.join(ROOT, rel);
  const pkg = JSON.parse(readFileSync(absPath, "utf8"));
  let changed = false;

  for (const section of DEP_SECTIONS) {
    const deps = pkg[section];
    if (!deps) continue;
    for (const [name, v] of Object.entries(deps)) {
      const c = classify(v);
      if (c.kind === "workspace") continue;
      // Fold named catalog refs → default catalog
      if (c.kind === "catalog" && c.named) {
        deps[name] = "catalog:";
        changed = true;
        entriesChanged++;
        continue;
      }
      if (c.kind === "catalog") continue; // already using default
      // For wildcards + pinned versions: if the dep is in our final catalog,
      // convert to catalog:. If not, leave as-is.
      if (finalCatalog.has(name)) {
        if (deps[name] !== "catalog:") {
          deps[name] = "catalog:";
          changed = true;
          entriesChanged++;
        }
      }
    }
  }

  if (changed) {
    writeFileSync(absPath, JSON.stringify(pkg, null, 2) + "\n");
    filesChanged++;
  }
}

console.log(
  `✔ rewrote ${filesChanged} package.json files (${entriesChanged} dep entries flipped to catalog:)`,
);
