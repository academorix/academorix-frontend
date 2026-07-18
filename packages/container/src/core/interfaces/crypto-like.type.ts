/**
 * @file crypto-like.type.ts
 * @module @stackra/container/core/interfaces
 * @description Minimal crypto interface for UUID generation fallback.
 */

/** Minimal crypto interface (subset of node:crypto or globalThis.crypto). */
export type ICryptoLike = { randomUUID?: () => string };
