/**
 * @file sdui-page-resolution.interface.ts
 * @module @stackra/contracts/interfaces/sdui
 * @description Result of resolving a URL through the page resolver.
 */

import type { ISduiScreen } from "./sdui-screen.interface";

/**
 * A page descriptor — one entry in the app's page catalog.
 */
export interface ISduiPageDescriptor {
  readonly id: string;
  readonly path: string;
  readonly title?: string;
  readonly resource?: string;
  readonly scene?: string;
  readonly mode?: "page" | "drawer" | "dialog";
  readonly permissions?: readonly string[];
  readonly ttl?: number;
  readonly meta?: Readonly<Record<string, unknown>>;
}

/**
 * The result of resolving a URL against the SDUI backend.
 */
export type ISduiPageResolution =
  | ({ readonly type: "page" } & ISduiScreen)
  | { readonly type: "redirect"; readonly to: string; readonly status?: 301 | 302 | 307 | 308 }
  | { readonly type: "notFound"; readonly reason?: string };
