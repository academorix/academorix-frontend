# @academorix/config-tailwind

Shared Tailwind preset for every app + package that ships CSS.

## Usage

### Tailwind v4 (Vite apps)

```css
/* apps/dashboard/src/styles.css */
@import "tailwindcss";
@config "../../../packages/config/tailwind/preset.mjs";
@import "@academorix/ui/react/styles";
```

### Tailwind v3

```js
// tailwind.config.js
import preset from "@academorix/config-tailwind";

export default {
  presets: [preset],
  content: ["./src/**/*.{ts,tsx}"],
};
```

## What's in the preset

- **`darkMode: ['class', '[data-theme="dark"]']`** — piggy-backs on HeroUI Pro's
  theme-attribute strategy.
- **Content globs** — scans the consuming app's `src/`, `index.html`, and the
  workspace `@academorix/ui` package.
- **Container defaults** — HeroUI Pro-aligned max-widths + padding.

Design tokens (color, spacing scale, typography) come from HeroUI Pro via the
imported CSS. Do NOT redeclare them in this preset.
