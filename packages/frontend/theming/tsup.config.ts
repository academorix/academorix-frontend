import { defineBaseConfig } from "@academorix/config-tsup";

export default defineBaseConfig(
  {
    index: "src/core/index.ts",
    react: "src/react/index.ts",
    native: "src/native/index.ts",
  },
  {
    // Optional peers loaded lazily inside the native subpath — must be
    // externalised so the web bundle doesn't try to resolve them.
    external: [
      "react",
      "react-native",
      "react-native-reanimated",
      "@react-native-async-storage/async-storage",
      "@expo/vector-icons",
      "@heroui/react",
    ],
  },
);
