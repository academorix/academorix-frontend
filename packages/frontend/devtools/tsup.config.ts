/**
 * @file tsup.config.ts
 * @module @stackra/devtools/build
 * @description tsup configuration for `@stackra/devtools`.
 *
 *   The package publishes four subpaths — the DI runtime (`.`), the
 *   web shell (`./react`), the native shell (`./native`), and the
 *   testing subpath (`./testing`). Each entry maps 1:1 onto a
 *   subpath declared in `package.json`'s `exports` map.
 *
 *   Optional peers loaded lazily inside the native subpath
 *   (`react-native`, `heroui-native-pro`) are externalised so the
 *   web bundle never resolves them statically.
 */

import { defineBaseConfig } from "@academorix/config-tsup";

export default defineBaseConfig(
  {
    // Core DI runtime — module, registries, decorators, config trio.
    index: "src/core/index.ts",
    // React (web) shell — launcher, drawer, panels, hooks, provider.
    react: "src/react/index.ts",
    // React Native shell — BottomSheet + native panel mirrors.
    native: "src/native/index.ts",
    // In-memory mocks + createMock* factories for consumer tests.
    testing: "src/testing/index.ts",
  },
  {
    // Optional peers imported lazily on the native subpath — must be
    // externalised so the web bundle doesn't resolve them statically.
    external: ["react-native", "heroui-native-pro"],
  },
);
