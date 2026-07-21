import { defineBaseConfig } from "@stackra/config-tsup";

export default defineBaseConfig(
  {
    // Core DI runtime — Module + services + config trio.
    index: "src/core/index.ts",
    // Web Push subscription manager + module.
    push: "src/push/index.ts",
    // React (web) bindings — hooks + components.
    react: "src/react/index.ts",
    // React Native subpath — native push token adapters + module.
    native: "src/native/index.ts",
    // In-memory mocks + createMock* factories for consumer tests.
    testing: "src/testing/index.ts",
  },
  {
    // Optional peers loaded lazily via `await import(...)` on the
    // native subpath — must be externalised so the web bundle
    // doesn't resolve them statically.
    external: ["react-native", "expo-notifications"],
  },
);
