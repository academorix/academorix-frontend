/**
 * @file overlay.registry.ts
 * @module @stackra/ui/actions/registries
 * @description OverlayRegistry — observable set of open overlays keyed
 *   by id, with an insertion-ordered stack for `closeTop`.
 *
 *   Deliberately does NOT extend {@link BaseRegistry} from
 *   `@stackra/support`. BaseRegistry's strict-register-once contract
 *   fits the "register commands / plugins / drivers at bootstrap"
 *   pattern, not the "reactive open-set that changes on every user
 *   action" pattern this class implements (see
 *   `.kiro/steering/support-utilities.md` — the base itself carves
 *   out "state stores" as non-fit).
 *
 *   The class name + `.registry.ts` filename are kept because the
 *   contract interface (`IOverlayRegistry` in `@stackra/contracts`)
 *   locks that vocabulary in the public API surface.
 *
 * @support-utilities-exempt observable open-set, not a BaseRegistry
 */

import { Injectable } from "@stackra/container";
import type { IOverlayRegistry } from "@stackra/contracts";

/**
 * OverlayRegistry — one place every open overlay lives.
 */
@Injectable()
export class OverlayRegistry implements IOverlayRegistry {
  /** Insertion-ordered map of open overlay ids → payload. */
  private readonly openSet = new Map<string, unknown>();
  private readonly listeners = new Set<(open: ReadonlySet<string>) => void>();

  public open(overlayId: string, payload?: unknown): void {
    this.openSet.set(overlayId, payload);
    this.notify();
  }

  public close(overlayId: string): void {
    if (this.openSet.delete(overlayId)) this.notify();
  }

  public closeTop(): void {
    const last = Array.from(this.openSet.keys()).pop();
    if (last !== undefined) this.close(last);
  }

  public isOpen(overlayId: string): boolean {
    return this.openSet.has(overlayId);
  }

  public getPayload(overlayId: string): unknown {
    return this.openSet.get(overlayId);
  }

  public subscribe(listener: (open: ReadonlySet<string>) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    const snapshot = new Set(this.openSet.keys());
    for (const listener of this.listeners) {
      try {
        listener(snapshot);
      } catch {
        // Never let one listener break the others.
      }
    }
  }
}
