#!/usr/bin/env node
/**
 * @file strip-stackra-ui.mjs
 * @description
 * `@stackra/ui` doesn't exist in this workspace (packages/ui ships as
 * `@stackra/ui`). Remove every `@stackra/ui` reference from the 5
 * dead `@stackra/*` packages that carry it as an optional peer +
 * devDep. Safe: the peer is already marked `optional: true`.
 */

import { readFileSync, writeFileSync } from "node:fs";

const TARGETS = [
  "packages/cache/package.json",
  "packages/error/package.json",
  "packages/network/package.json",
  "packages/queue/package.json",
  "packages/routing/package.json",
];

for (const rel of TARGETS) {
  const pkg = JSON.parse(readFileSync(rel, "utf8"));
  let changed = false;

  for (const section of [
    "dependencies",
    "devDependencies",
    "peerDependencies",
    "optionalDependencies",
  ]) {
    if (pkg[section] && "@stackra/ui" in pkg[section]) {
      delete pkg[section]["@stackra/ui"];
      changed = true;
    }
  }

  if (pkg.peerDependenciesMeta && "@stackra/ui" in pkg.peerDependenciesMeta) {
    delete pkg.peerDependenciesMeta["@stackra/ui"];
    changed = true;
  }

  if (changed) {
    writeFileSync(rel, JSON.stringify(pkg, null, 2) + "\n");
    console.log(`✔ stripped @stackra/ui from ${rel}`);
  }
}
