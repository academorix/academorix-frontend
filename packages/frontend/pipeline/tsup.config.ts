import { defineBaseConfig } from "@stackra/config-tsup";

export default defineBaseConfig({
  index: "src/index.ts",
  testing: "src/testing/index.ts",
});
