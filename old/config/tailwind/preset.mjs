/**
 * @file packages/config/tailwind/preset.mjs
 *
 * @description
 * Shared Tailwind CSS v4 preset. Consumers reference this file via
 * an `@config` directive (v4) or a JS `presets: []` array (v3).
 *
 * Tailwind v4 native token exposure means the actual design tokens
 * live in `@academorix/ui`'s CSS (imported as `@import
 * '@academorix/ui/react/styles'`). This preset only carries:
 *
 * - `content` scanning globs so every app + package's markup is
 *   picked up during build
 * - `darkMode: 'class'` — HeroUI Pro drives dark mode via a
 *   `data-theme="dark"` attribute; Tailwind's `class` strategy
 *   piggy-backs on it
 * - Container defaults matching HeroUI Pro's layout scale
 */

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class", '[data-theme="dark"]'],
  content: [
    "./src/**/*.{ts,tsx,js,jsx,html}",
    "./index.html",
    // Also scan every consumed workspace package so component classes
    // ship into the app's CSS bundle.
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      container: {
        center: true,
        padding: {
          DEFAULT: "1rem",
          sm: "1.5rem",
          lg: "2rem",
          xl: "3rem",
          "2xl": "4rem",
        },
        screens: {
          sm: "640px",
          md: "768px",
          lg: "1024px",
          xl: "1280px",
          "2xl": "1536px",
        },
      },
    },
  },
  plugins: [],
};
