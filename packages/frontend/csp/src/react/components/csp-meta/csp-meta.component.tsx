/**
 * @file csp-meta.component.tsx
 * @module @stackra/csp/react/components
 * @description CspMeta — renders the CSP policy as a `<meta http-equiv>`
 *   tag for SPAs that can't set HTTP headers. Reads the cached policy from
 *   the DI-managed CSP service. Head renderer — owns no restylable markup,
 *   so it is exempt from the HeroUI UI rule.
 */

import { type ReactElement } from 'react';
import { useInject } from '@stackra/container/react';
import { CSP_SERVICE } from '@stackra/contracts';
import type { ICspService } from '@stackra/contracts';

/**
 * Renders the CSP policy as a `<meta http-equiv="Content-Security-Policy">`
 * tag. Use in SPA mode where you can't set HTTP headers — place it in your
 * root layout `<head>`. The policy is generated once and cached for the
 * page lifetime.
 *
 * @returns A meta element with the CSP header value.
 *
 * @example
 * ```tsx
 * import { CspMeta } from '@stackra/csp/react';
 *
 * function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <head><CspMeta /></head>
 *       <body>{children}</body>
 *     </html>
 *   );
 * }
 * ```
 */
export function CspMeta(): ReactElement {
  const cspService = useInject<ICspService>(CSP_SERVICE);
  const policy = cspService.getPolicy();

  return <meta httpEquiv={policy.headerName} content={policy.header} />;
}

CspMeta.displayName = 'CspMeta';
