/**
 * @file tsup.config.ts
 * @module @stackra/kbd/build
 * @description tsup build configuration for `@stackra/kbd`.
 *
 *   The package ships a single `.` entry today. When the React /
 *   non-React split lands (planned follow-up), this file grows a
 *   `react` entry pointing at `src/react/index.ts`.
 */

import { defineBaseConfig } from "@academorix/config-tsup";

export default defineBaseConfig(
  {
    index: "src/index.ts",
  },
  {
    // React, react-dom, and heroui-* are optional peers — never bundle
    // them. `@tanstack/react-hotkeys` is a REQUIRED peer but still
    // treated as external so consumers control the version.
    external: [
      "react",
      "react-dom",
      "@heroui/react",
      "@heroui-pro/react",
      "@stackra/ui",
      "@stackra/ui/react",
      "@tanstack/react-hotkeys",
      "@tanstack/react-hotkeys-devtools",
      "@tanstack/react-devtools",
      "@tanstack/react-store",
      "@tanstack/store",
    ],
  },
);
