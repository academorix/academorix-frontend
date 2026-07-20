import { defineBaseConfig } from "../../tsup.config.base";

export default defineBaseConfig(
  {
    index: "src/core/index.ts",
    react: "src/react/index.ts",
    native: "src/native/index.ts",
    testing: "src/testing/index.ts",
  },
  {
    // Native-only optional peers, lazily imported by the RN detector.
    external: ["@react-native-community/netinfo", "react-native", "heroui-native"],
  },
);
