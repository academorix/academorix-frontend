import { defineBaseConfig } from "@stackra/config-tsup";

export default defineBaseConfig(
  {
    index: "src/core/index.ts",
    react: "src/react/index.ts",
    native: "src/native/index.ts",
    testing: "src/testing/index.ts",
  },
  {
    // Optional peers loaded lazily / behind subpaths.
    // Marked external so the bundler doesn't try to include them in the
    // web/native entry when they're not installed.
    external: ["dexie", "@react-native-async-storage/async-storage", "react-native"],
  },
);
