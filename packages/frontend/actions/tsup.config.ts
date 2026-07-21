import { defineBaseConfig } from "@stackra/config-tsup";

export default defineBaseConfig(
  {
    index: "src/core/index.ts",
    react: "src/react/index.ts",
    native: "src/native/index.ts",
    testing: "src/testing/index.ts",
  },
  {
    // React & React Native are optional peers — never bundle them, and
    // never eagerly resolve `react-native` at build time either.
    external: ["react", "react-native", "@stackra/ui"],
  },
);
