/**
 * @file index.ts
 * @module @stackra/pwa/react/components/pwa-head
 * @description Entity barrel — re-exports the `PwaHead` component that
 *   renders every PWA-relevant `<meta>` / `<link>` head tag, along with
 *   its `PwaHeadProps` and the `IPwaHeadAppleIcon` /
 *   `IPwaHeadAppleStartupImage` shapes.
 */

export { PwaHead } from "./pwa-head.component";
export type {
  PwaHeadProps,
  IPwaHeadAppleIcon,
  IPwaHeadAppleStartupImage,
} from "./pwa-head.interface";
