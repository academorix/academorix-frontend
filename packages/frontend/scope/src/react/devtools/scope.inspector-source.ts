/**
 * @file scope.inspector-source.ts
 * @module @stackra/scope/react/devtools
 * @description Devtools inspector source for `@stackra/scope` —
 *   scans the DOM for `[data-scope]` scope-region markers and
 *   surfaces one region per marked element.
 *
 *   Any component (e.g. a `<ScopeRegion>` wrapper, or a manual
 *   `data-scope` attribute) can opt into inspector visualisation by
 *   stamping `data-scope="<label>"` on its root element. The scope
 *   panel becomes the anchor overlay showing where in the page each
 *   scope boundary lives.
 *
 *   Registered by `ScopeModule.forRoot()` via
 *   `DevtoolsModule.forInspectorSource([ScopeInspectorSource])`.
 */

import { Injectable } from '@stackra/container';
import { collect } from '@stackra/support';
import { DevtoolsInspectorSource } from '@stackra/devtools';
import type { IDevtoolsInspectorRegion, IDevtoolsInspectorRegionSource } from '@stackra/contracts';

/** CSS selector that catches every scope region marker. */
const SCOPE_REGION_SELECTOR = '[data-scope]';

/**
 * The scope inspector source — one region per `[data-scope]` element.
 */
@Injectable()
@DevtoolsInspectorSource({
  id: 'scope',
  panelId: 'scope',
  label: 'Scope regions',
})
export class ScopeInspectorSource implements IDevtoolsInspectorRegionSource {
  /** @inheritdoc */
  public readonly id = 'scope';
  /** @inheritdoc */
  public readonly label = 'Scope regions';
  /** @inheritdoc */
  public readonly panelId = 'scope';

  /**
   * Enumerate every scope region currently in the DOM.
   *
   * Returns an empty list under SSR (no `document`) — the shell only
   * calls this while the inspector overlay is open, which is a
   * client-only flow.
   */
  public collect(): readonly IDevtoolsInspectorRegion[] {
    if (typeof document === 'undefined') return [];
    // `collect(...)` from @stackra/support wraps the NodeList in a
    // collection with a fluent map API. We keep it single-hop here —
    // one map to build the region shape — but the same pipeline
    // could grow to filter / sort without touching the loop.
    return collect(Array.from(document.querySelectorAll<HTMLElement>(SCOPE_REGION_SELECTOR)))
      .map((element, index) => this.buildRegion(element, index))
      .all();
  }

  /**
   * Build a single {@link IDevtoolsInspectorRegion} from a DOM element.
   *
   * @param element - The scope region host element.
   * @param index - Positional index used to build a stable id when the
   *   element has no `data-scope` label of its own.
   */
  private buildRegion(element: HTMLElement, index: number): IDevtoolsInspectorRegion {
    // Prefer the `data-scope` attribute value as the label — it names
    // the region in the app's own terms. Fall back to the element's
    // tag name so the tooltip is never empty.
    const rawLabel = element.dataset.scope || element.tagName.toLowerCase();
    return {
      id: `scope-${index}`,
      label: `${rawLabel} scope`,
      panelId: 'scope',
      // Lazy accessor — measurement only pays its cost when the
      // overlay actually renders the region.
      bounds: (): DOMRect | null => {
        try {
          return element.getBoundingClientRect();
        } catch {
          // fail-soft — a detached / removed node returns null so
          // the overlay skips it silently.
          return null;
        }
      },
    };
  }
}
