import { defineBaseConfig } from "@academorix/config-tsup";

export default defineBaseConfig({
  index: "src/core/index.ts",
  react: "src/react/index.ts",
  router: "src/router/index.ts",
  testing: "src/testing/index.ts",
});
