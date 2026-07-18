/**
 * @file index.ts
 * @module @stackra/routing/react/adapt-page-module
 * @description Barrel for the page-module → RRv7 adapter utilities.
 */

export { adaptPageModule } from "./adapt-page-module.util";
export { adaptLayoutModule } from "./adapt-layout-module.util";
export { toRrv7Routes } from "./to-rrv7-routes.util";
export { extractBasicMetaTags, type IRrvMetaTag } from "./extract-basic-meta-tags.util";
export type { IPageModule, ILayoutModule } from "./page-module.interface";
