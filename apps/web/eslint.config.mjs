import react from "@academorix/eslint-config/react";

export default [
  {
    ignores: ["dist/**", "coverage/**", ".turbo/**"],
  },
  ...react,
];
