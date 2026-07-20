/**
 * @file index.ts
 * @module @stackra/i18n/react/resolvers
 * @description Barrel export for web locale resolvers. Option interfaces
 *   live in `../interfaces` and are re-exported by the react interfaces
 *   barrel.
 */

export { LocalStorageResolver } from './local-storage.resolver';
export { NavigatorResolver } from './navigator.resolver';
export { UrlParamResolver } from './url-param.resolver';
export { CookieResolver } from './cookie.resolver';
export { SubdomainResolver } from './subdomain.resolver';
