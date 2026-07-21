import { defineBaseConfig } from "@stackra/config-tsup";

export default defineBaseConfig({
  index: "src/index.ts",
  core: "src/core/index.ts",
  devtools: "src/devtools/index.ts",
  logger: "src/logger/index.ts",
  events: "src/events/index.ts",
  cache: "src/cache/index.ts",
  queue: "src/queue/index.ts",
  routing: "src/routing/index.ts",
});
