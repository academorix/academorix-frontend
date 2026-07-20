/**
 * @file pwa-head.component.tsx
 * @module @stackra/pwa/react/components
 * @description Emits `<link>` and `<meta>` tags for PWA installability
 *   — manifest link, theme colour, Apple touch icons, and Apple
 *   startup images.
 *
 *   Consumers of frameworks that support `<head>` mounting inside
 *   the component tree (Vite + React 19's default, Next.js
 *   `<Metadata>`) mount `<PwaHead>` at the root. Older setups
 *   render its output at build time via renderToStaticMarkup.
 */

import type { ReactElement } from 'react';

import type { PwaHeadProps } from './pwa-head.interface';

/**
 * PWA meta emitter.
 *
 * @example
 * ```tsx
 * import { PwaHead } from '@stackra/pwa/react';
 *
 * function AppRoot() {
 *   return (
 *     <>
 *       <PwaHead
 *         themeColor="#0EA5E9"
 *         appleIcons={[{ href: '/apple-touch-icon.png', sizes: '180x180' }]}
 *         appleStartupImages={applePwaStartupImages}
 *       />
 *       <App />
 *     </>
 *   );
 * }
 * ```
 */
export function PwaHead({
  manifestHref = '/manifest.webmanifest',
  themeColor,
  appleIcons,
  appleStartupImages,
  appleStatusBarStyle = 'default',
  appleWebAppCapable = true,
  appleWebAppTitle,
}: PwaHeadProps = {}): ReactElement {
  // React 19 hoists `<link>` and `<meta>` in-tree to the `<head>`
  // automatically. Earlier versions require a portal — consumers on
  // older React use `renderToStaticMarkup(<PwaHead ... />)` at build
  // time and inline the HTML.
  return (
    <>
      <link rel="manifest" href={manifestHref} />
      {themeColor ? <meta name="theme-color" content={themeColor} /> : null}
      {/* Apple-specific meta tags — iOS reads them when the app is
          installed to the home screen. */}
      <meta name="mobile-web-app-capable" content={appleWebAppCapable ? 'yes' : 'no'} />
      <meta name="apple-mobile-web-app-capable" content={appleWebAppCapable ? 'yes' : 'no'} />
      <meta name="apple-mobile-web-app-status-bar-style" content={appleStatusBarStyle} />
      {appleWebAppTitle ? (
        <meta name="apple-mobile-web-app-title" content={appleWebAppTitle} />
      ) : null}
      {appleIcons?.map((icon) => (
        <link
          key={icon.href}
          rel="apple-touch-icon"
          href={icon.href}
          {...(icon.sizes ? { sizes: icon.sizes } : {})}
        />
      ))}
      {appleStartupImages?.map((image) => (
        <link
          key={image.href}
          rel="apple-touch-startup-image"
          href={image.href}
          media={image.media}
        />
      ))}
    </>
  );
}
