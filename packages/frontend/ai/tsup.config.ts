import { defineBaseConfig } from "@academorix/config-tsup";

export default defineBaseConfig(
  {
    index: "src/core/index.ts",
    react: "src/react/index.ts",
    native: "src/native/index.ts",
    testing: "src/testing/index.ts",
  },
  {
    // Optional peers loaded lazily / behind subpaths: the React/native
    // layers pull in `react` and `react-native`, HeroUI Pro via `@stackra/ui`,
    // the HeroUI Native OSS primitives via `heroui-native`, multi-tab
    // leadership via `@stackra/coordinator`, offline detection via
    // `@stackra/network`, and tool schemas via `zod`. Keep them external
    // so headless consumers aren't forced to install them.
    external: [
      "react",
      "react-native",
      "heroui-native",
      "@stackra/ui",
      "@stackra/coordinator",
      "@stackra/network",
      "zod",
    ],
  },
);
