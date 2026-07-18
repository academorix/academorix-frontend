import { defineBaseConfig } from "../../tsup.config.base";

export default defineBaseConfig({
  index: "src/index.ts",
  testing: "src/testing/index.ts",
});
