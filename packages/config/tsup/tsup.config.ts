/**
 * @file tsup.config.ts
 * @description
 * Self-hosted tsup config for the config-tsup package itself.
 *
 * We can't use `defineBaseConfig` from this package to build this package
 * (it doesn't exist until the build runs), so we use tsup's own
 * `defineConfig` directly. The output shape mirrors what `defineBaseConfig`
 * would produce.
 */
import { defineConfig } from "tsup";

export default defineConfig({
  entry: { index: "src/index.ts" },
  format: ["cjs", "esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  target: "es2022",
  tsconfig: "./tsconfig.json",
  keepNames: true,
});
