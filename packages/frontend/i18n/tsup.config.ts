import { defineBaseConfig } from "@academorix/config-tsup";

export default defineBaseConfig(
  {
    index: "src/core/index.ts",
    react: "src/react/index.ts",
    native: "src/native/index.ts",
    vite: "src/vite/index.ts",
    testing: "src/testing/index.ts",
  },
  {
    // Optional peers loaded lazily / behind subpaths.
    external: [
      "react-native",
      "vite",
      // Native-only optional peers loaded lazily via variable-specifier
      // `await import(...)` — safe to omit from the web bundle; Metro
      // resolves them at runtime on RN targets where they're installed.
      "@react-native-async-storage/async-storage",
      "expo-localization",
      "heroui-native",
    ],
  },
);
