import { defineBaseConfig } from "@academorix/config-tsup";

export default defineBaseConfig(
  {
    index: "src/core/index.ts",
    react: "src/react/index.ts",
    native: "src/native/index.ts",
    testing: "src/testing/index.ts",
  },
  {
    // Optional peers loaded lazily inside the native subpath — must be
    // externalised so the web bundle doesn't try to resolve them.
    external: [
      "react-native",
      "heroui-native",
      "heroui-native-pro",
      "@react-native-async-storage/async-storage",
    ],
  },
);
