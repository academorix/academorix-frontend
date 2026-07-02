import react from "@academorix/eslint-config/react";

export default [
  ...react,
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      // Ported pointer-driven components (pattern-lock, pin-lock, file-upload)
      // can't cleanly satisfy these; keep them visible as warnings.
      "jsx-a11y/click-events-have-key-events": "warn",
      "jsx-a11y/no-noninteractive-element-interactions": "warn",
      "jsx-a11y/no-static-element-interactions": "warn",
    },
  },
];
