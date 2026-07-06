/**
 * @file fonts.ts
 * @module config/fonts
 *
 * @description
 * `next/font/google` bindings for the marketing surface. Inter drives the body
 * + headings; Fira Code is loaded lazily for the occasional inline code block
 * in `/docs` and technical blog posts.
 *
 * Both fonts expose CSS variables (`--font-sans`, `--font-mono`) that our
 * shared Tailwind theme resolves in `styles/globals.css`. Setting `display:
 * "swap"` avoids invisible text during font load — critical for the LCP score
 * on the landing page.
 */

import { Fira_Code as FontMono, Inter as FontSans } from "next/font/google";

/** Body + heading typeface. */
export const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

/** Monospaced typeface for code blocks. */
export const fontMono = FontMono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});
