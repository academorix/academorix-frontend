import { defineBaseConfig } from "@academorix/config-tsup";

export default defineBaseConfig(
  {
    index: "src/core/index.ts",
    react: "src/react/index.ts",
    testing: "src/testing/index.ts",
  },
  {
    // Lazy-loaded / optional reporter backends
    external: ["pino", "consola"],
  },
);
