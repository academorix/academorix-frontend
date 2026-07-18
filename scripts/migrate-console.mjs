#!/usr/bin/env node
/**
 * @file migrate-console.mjs
 * @description
 * One-shot rewrite of the copied `packages/console` tree to drop every
 * NestJS reference in favor of the @stackra/* equivalents already in
 * this workspace.
 *
 * Substitutions:
 *  - `from '@nestjs/common'`  → `from '@stackra/container'`
 *  - `from '@nestjs/core'`    → `from '@stackra/container'`
 *  - `from '@nestjs/testing'` → `from '@stackra/testing'`
 *  - `from '@stackra/ts-support'` → `from '@stackra/support'`
 *  - symbol renames: `IInjectable` → `Injectable`, `IDynamicModule` → `DynamicModule`,
 *    `IOnModuleInit` → `OnModuleInit`, `IType` → `Type`, `NestFactory` → `ApplicationFactory`,
 *    `INestApplicationContext` → `IApplicationContext`
 *  - docblock scrubbing: replace `NestJS ` → `stackra `, `Nest ` → `stackra `,
 *    `nestjs` → `@stackra/container`
 */

import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const CONSOLE_ROOT = "packages/console";

const files = execSync(
  `find ${CONSOLE_ROOT} -type f \\( -name '*.ts' -o -name '*.mts' -o -name '*.cts' -o -name '*.md' -o -name '*.json' -o -name '*.ejs' \\) -not -path '*/node_modules/*' -not -path '*/dist/*'`,
  { encoding: "utf8" },
)
  .trim()
  .split("\n")
  .filter(Boolean);

const IMPORT_REWRITES = [
  [/(from\s+['"])@nestjs\/common(['"])/g, "$1@stackra/container$2"],
  [/(from\s+['"])@nestjs\/core(['"])/g, "$1@stackra/container$2"],
  [/(from\s+['"])@nestjs\/testing(['"])/g, "$1@stackra/testing$2"],
  [/(from\s+['"])@stackra\/ts-support(['"])/g, "$1@stackra/support$2"],
  [/(from\s+['"])@stackra\/ts-container(['"])/g, "$1@stackra/container$2"],
];

const SYMBOL_REWRITES = [
  [/\bIInjectable\b/g, "Injectable"],
  [/\bIDynamicModule\b/g, "DynamicModule"],
  [/\bIOnModuleInit\b/g, "OnModuleInit"],
  [/\bIType\b(?!Guard)/g, "Type"],
  [/\bNestFactory\b/g, "ApplicationFactory"],
  [/\bINestApplicationContext\b/g, "IApplicationContext"],
];

const DOCBLOCK_REWRITES = [
  [/\bNestJS-compatible\b/g, "@stackra/container"],
  [/\bNestJS\b/g, "@stackra/container"],
  [/\bnestjs\b/gi, "@stackra/container"],
  [/\bNest DI\b/g, "@stackra/container DI"],
  [/@nestjs\/common/g, "@stackra/container"],
  [/@nestjs\/core/g, "@stackra/container"],
  [/@nestjs\/testing/g, "@stackra/testing"],
  [/@stackra\/ts-support/g, "@stackra/support"],
  [/@stackra\/ts-container/g, "@stackra/container"],
];

let filesChanged = 0;
let importsChanged = 0;
let symbolsChanged = 0;
let docsChanged = 0;

for (const file of files) {
  const raw = readFileSync(file, "utf8");
  let out = raw;

  for (const [pattern, replacement] of IMPORT_REWRITES) {
    const before = out;
    out = out.replace(pattern, replacement);
    if (out !== before) importsChanged++;
  }
  for (const [pattern, replacement] of SYMBOL_REWRITES) {
    const before = out;
    out = out.replace(pattern, replacement);
    if (out !== before) symbolsChanged++;
  }
  for (const [pattern, replacement] of DOCBLOCK_REWRITES) {
    const before = out;
    out = out.replace(pattern, replacement);
    if (out !== before) docsChanged++;
  }

  if (out !== raw) {
    writeFileSync(file, out);
    filesChanged++;
  }
}

console.log(`✔ scanned ${files.length} files, wrote ${filesChanged}`);
console.log(
  `  import rewrites: ${importsChanged}, symbol rewrites: ${symbolsChanged}, doc rewrites: ${docsChanged}`,
);
