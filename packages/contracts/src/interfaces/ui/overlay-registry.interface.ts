/**
 * @file overlay-registry.interface.ts
 * @module @stackra/contracts/interfaces/ui
 * @description App-wide overlay registry surface for `@stackra/ui`.
 */

/**
 * Observable registry of open overlays.
 *
 * Bound under `OVERLAY_REGISTRY`. The `OpenOverlayHandler` /
 * `CloseOverlayHandler` from `@stackra/ui/actions` operate on it;
 * overlay components subscribe via a hook to know when to render.
 */
export interface IOverlayRegistry {
  open(overlayId: string, payload?: unknown): void;
  close(overlayId: string): void;
  closeTop(): void;
  isOpen(overlayId: string): boolean;
  getPayload(overlayId: string): unknown;
  subscribe(listener: (open: ReadonlySet<string>) => void): () => void;
}
