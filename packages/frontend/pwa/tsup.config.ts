import { defineBaseConfig } from "@academorix/config-tsup";

export default defineBaseConfig(
  {
    // Core DI runtime — Module + service + config trio + hooks.
    index: "src/core/index.ts",
    // React (web) bindings — components + hooks.
    react: "src/react/index.ts",
    // Build-time Web App Manifest builder.
    manifest: "src/manifest/index.ts",
    // Curated Workbox runtime-caching rules.
    workbox: "src/workbox/index.ts",
    // vite-plugin-pwa + @vite-pwa/assets-generator config builders.
    vite: "src/vite/index.ts",
    // Bubblewrap TWA (Android APK/AAB) config builder.
    twa: "src/twa/index.ts",
    // In-memory mocks + createMock* factories for consumer tests.
    testing: "src/testing/index.ts",
  },
  {
    // Optional peers loaded lazily via `await import(/* @vite-ignore */ ...)`
    // or referenced only in caller-owned types — must be externalised so
    // the runtime bundle never resolves them statically.
    external: [
      "vite",
      "vite-plugin-pwa",
      "@vite-pwa/assets-generator",
      "qrcode",
      "@bubblewrap/cli",
    ],
  },
);
