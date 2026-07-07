import react from "@academorix/eslint-config/react";

export default [
  {
    // Skip generated build outputs. `src-tauri/target/**` is Cargo's build
    // directory (gigabyte-scale binaries + emitted `.js` shims); `gen/`
    // holds the Tauri v2 mobile-target scaffolds regenerated on every
    // build. Both are gitignored (see `src-tauri/.gitignore`) but ESLint
    // still walks them unless we exclude them here.
    ignores: ["dist/**", "coverage/**", ".turbo/**", "src-tauri/target/**", "src-tauri/gen/**"],
  },
  ...react,
];
