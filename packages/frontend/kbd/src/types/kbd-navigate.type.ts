/**
 * @file kbd-navigate.type.ts
 * KbdNavigate — Type.
 *
 * @module @stackra/kbd/types
 */

/**
 * Optional navigate function — when set, route-style shortcuts
 * (`{ to: "/products" }`) are dispatched through this fn instead of
 * needing a handler.
 */
export type KbdNavigate = (to: string) => void;
