import { defineBaseConfig } from "../../tsup.config.base";

export default defineBaseConfig(
  {
    index: "src/core/index.ts",
  },
  {
    // `dotenv` + `dotenv-expand` are only imported inside `isNode()` branches
    // (dynamic `import(...)`). Marking them external keeps the browser bundle
    // free of `fs` / `node:fs` transitive references. The `node:*` subpath
    // externals guard against tsup accidentally inlining a Node builtin.
    external: ["dotenv", "dotenv-expand", "node:fs", "node:path", "joi"],
  },
);
