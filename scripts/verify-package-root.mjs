// Verify Path.packageRoot behavior — sanity check for the bug the
// vitest-test-engineer agent flagged.
import { Path } from "../packages/support/dist/index.mjs";
import { QueueModule } from "../packages/queue/dist/index.mjs";
import { CacheModule } from "../packages/cache/dist/index.mjs";
import { RoutingModule } from "../packages/routing/dist/index.mjs";
import { EventEmitterModule } from "../packages/events/dist/index.mjs";
import { NetworkModule } from "../packages/network/dist/index.mjs";
import { ConfigModule } from "../packages/config/dist/index.mjs";

console.log("=== Actual PACKAGE_ROOT for each module (resolved from dist/) ===");
console.log("QueueModule.PACKAGE_ROOT:   ", QueueModule.PACKAGE_ROOT);
console.log("CacheModule.PACKAGE_ROOT:   ", CacheModule.PACKAGE_ROOT);
console.log("RoutingModule.PACKAGE_ROOT: ", RoutingModule.PACKAGE_ROOT);
console.log("EventEmitterModule.PACKAGE_ROOT:", EventEmitterModule.PACKAGE_ROOT);
console.log("NetworkModule.PACKAGE_ROOT: ", NetworkModule.PACKAGE_ROOT);
console.log("ConfigModule.PACKAGE_ROOT:  ", ConfigModule.PACKAGE_ROOT);

// Simulate from-source resolution too — the dist has different depth
// than src/, which changes the correct `levels` value.
import { pathToFileURL } from "node:url";
import path from "node:path";
const srcUrl = pathToFileURL(path.resolve("packages/queue/src/core/queue.module.ts")).href;
console.log("");
console.log("=== From-source simulation (packages/queue/src/core/queue.module.ts) ===");
console.log("Path.dirname:               ", Path.dirname(srcUrl));
console.log("Path.packageRoot (default 3):", Path.packageRoot(srcUrl));
console.log("Path.packageRoot (levels=2): ", Path.packageRoot(srcUrl, 2));
console.log("Path.packageRoot (levels=1): ", Path.packageRoot(srcUrl, 1));
