import { defineBaseConfig } from "@stackra/config-tsup";

export default defineBaseConfig({
  index: "src/core/index.ts",
  matchers: "src/matchers/index.ts",
  preset: "src/preset/index.ts",
  setup: "src/preset/setup.ts",
});
