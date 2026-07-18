/**
 * @file devtools-panel.interface.ts
 * @module @stackra/contracts/interfaces/devtools
 * @description Devtools panel contribution shape + composite family
 *   (`IDevtoolsView`, `IDevtoolsAction`, `IDevtoolsAuthGate`).
 *
 *   `IDevtoolsPanel` is the primary export. The inner family shapes
 *   live in the same file per `code-standards.md`'s composite-family
 *   grouping exception — they exist ONLY as parts of the outer panel
 *   contract and are not consumed independently across the workspace.
 *   Types (e.g. category unions) live in `contracts/src/types/`.
 */

import type { DevtoolsCategory } from "../../types/devtools-category.type";

// ════════════════════════════════════════════════════════════════════════════════
// Auth gate — optional per-panel ability check
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Optional ability-based gate applied to a devtools panel.
 *
 * Resolved by `useDevtoolsAuthGuard(gate?)` in the React shell — when
 * `@stackra/auth`'s `AUTH_SERVICE` / `ABILITY_SERVICE` are absent from
 * the container the gate fails open (devtools is a dev tool, not a
 * hard security boundary).
 */
export interface IDevtoolsAuthGate {
  /** Ability name checked via `@stackra/auth`'s ability service. */
  readonly ability: string;
  /** Optional resource passed to the ability check. */
  readonly resource?: string;
  /** Message shown on the locked-panel screen. */
  readonly message?: string;
}

// ════════════════════════════════════════════════════════════════════════════════
// Action — one entry in a `type: 'action'` panel
// ════════════════════════════════════════════════════════════════════════════════

/**
 * A single action rendered inside an `IDevtoolsView` of type
 * `'action'`. Actions are one-shot side effects — clearing caches,
 * draining queues, dumping state to the console — and each button
 * calls `handle()` when pressed.
 */
export interface IDevtoolsAction {
  /** Stable action id (`'clear-cache'`, `'drain-queue'`). */
  readonly id: string;
  /** Human-readable button label. */
  readonly label: string;
  /** Optional description shown below the label. */
  readonly description?: string;
  /**
   * Optional icon — the React shell expects a `ReactNode`; the native
   * shell also accepts a `ReactNode`. Kept as `unknown` in the contract
   * to avoid pulling React into the zero-runtime contracts package.
   */
  readonly icon?: unknown;
  /** Visual variant — the shell maps this to a HeroUI Pro button variant. */
  readonly variant?: "primary" | "secondary" | "tertiary" | "danger";
  /** When true, the shell prompts before firing `handle()`. */
  readonly requireConfirmation?: boolean;
  /** Fires when the user activates the action. */
  handle(): void | Promise<void>;
}

// ════════════════════════════════════════════════════════════════════════════════
// View — how a panel renders itself
// ════════════════════════════════════════════════════════════════════════════════

/**
 * A discriminated union describing how the panel's body is rendered.
 *
 * - `component` — the panel returns a `ReactNode`. This is the default
 *   for anything with custom UI.
 * - `action` — the panel exposes a list of one-shot actions; the shell
 *   renders each as a labelled button.
 * - `iframe` — the panel's body is a same-origin iframe pointed at
 *   `src`. Useful for embedding an existing dev UI (`/rq-devtools`, a
 *   panel served by a companion dev server).
 */
export type IDevtoolsView =
  | {
      /** Discriminator — always `'component'`. */
      readonly type: "component";
      /** Returns the panel body. The shell type-narrows to `ReactNode`. */
      render(): unknown;
    }
  | {
      /** Discriminator — always `'action'`. */
      readonly type: "action";
      /** Action list, rendered in order. */
      readonly actions: readonly IDevtoolsAction[];
    }
  | {
      /** Discriminator — always `'iframe'`. */
      readonly type: "iframe";
      /** URL loaded into the iframe. */
      readonly src: string;
      /**
       * When true, the iframe stays mounted when the panel is inactive
       * (state survives re-selection). When false, the iframe unmounts
       * on deactivate.
       *
       * @default false
       */
      readonly persistent?: boolean;
    };

// ════════════════════════════════════════════════════════════════════════════════
// Panel — the contribution contract
// ════════════════════════════════════════════════════════════════════════════════

/**
 * A single devtools panel contribution — the shape every package
 * decorates its class with via `@DevtoolsPanel(...)`.
 *
 * @example
 * ```typescript
 * import { Injectable, Inject } from '@stackra/container';
 * import {
 *   type IDevtoolsPanel,
 *   type IDevtoolsView,
 *   NETWORK_SERVICE,
 * } from '@stackra/contracts';
 * import { DevtoolsPanel } from '@stackra/devtools';
 *
 * @Injectable()
 * @DevtoolsPanel({ id: 'network', title: 'Network', category: 'network' })
 * export class NetworkDevtoolsPanel implements IDevtoolsPanel {
 *   public readonly id = 'network';
 *   public readonly title = 'Network';
 *   public readonly view: IDevtoolsView = {
 *     type: 'component',
 *     render: () => null, // rendered by the shell via a React binding
 *   };
 *
 *   public constructor(
 *     @Inject(NETWORK_SERVICE) private readonly network: unknown
 *   ) {}
 * }
 * ```
 */
export interface IDevtoolsPanel {
  /** Unique panel id — stable across sessions. */
  readonly id: string;
  /** Human-readable label rendered in the nav rail. */
  readonly title: string;
  /**
   * Optional icon — `ReactNode` on web, arbitrary payload on native.
   * Left as `unknown` in the contract to keep contracts React-free.
   */
  readonly icon?: unknown;
  /**
   * Group the panel falls under. Governs rail ordering.
   *
   * @default 'modules'
   */
  readonly category?: DevtoolsCategory;
  /**
   * Sort order within the category. Lower comes first.
   *
   * @default 100
   */
  readonly order?: number;
  /** How the panel body renders. */
  readonly view: IDevtoolsView;
  /** Optional gate — hides / locks the panel unless the ability passes. */
  readonly requireAuth?: IDevtoolsAuthGate;
  /**
   * Optional badge shown next to the title in the rail. Returning
   * `null` (or omitting the method) hides the badge.
   */
  badge?(): string | number | null;
  /** Optional lifecycle — called when the panel first becomes active. */
  onActivate?(): void | Promise<void>;
  /** Optional lifecycle — called when the panel loses focus. */
  onDeactivate?(): void;
}
