// Smoke test — every module.configurePublishables should exist statically
// and register the expected tag. Runs against the source files (regex) so
// it doesn't need the workspace to be built.
import fs from "node:fs";
import path from "node:path";

const cases = [
  ["packages/routing/src/core/routing.module.ts", "routing-config"],
  ["packages/cache/src/core/cache.module.ts", "cache-config"],
  ["packages/events/src/core/events.module.ts", "events-config"],
  ["packages/network/src/core/network.module.ts", "network-config"],
  ["packages/queue/src/core/queue.module.ts", "queue-config"],
  ["packages/console/src/console.module.ts", "console-stubs"],
];

let bad = 0;
for (const [file, tag] of cases) {
  const src = fs.readFileSync(path.resolve(file), "utf8");
  const hasStatic = /public static configurePublishables\s*\(/.test(src);
  const hasTag = src.includes(`tag: "${tag}"`) || src.includes(`tag: '${tag}'`);
  const ok = hasStatic && hasTag;
  console.log(
    `${ok ? "✓" : "✗"} ${path.basename(file).padEnd(28)}  static=${hasStatic} tag=${hasTag} (${tag})`,
  );
  if (!ok) bad++;
}
process.exit(bad === 0 ? 0 : 1);
