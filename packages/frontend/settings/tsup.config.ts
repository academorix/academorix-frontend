import { defineBaseConfig } from "@stackra/config-tsup";

export default defineBaseConfig({
  index: "src/core/index.ts",
  react: "src/react/index.ts",
  testing: "src/testing/index.ts",
});
