/**
 * @file index.ts
 * @module @academorix/notifications
 *
 * @description
 * Public root barrel. Prefer subpath imports for tree-shaking.
 *
 * ## Public API
 *
 *  - {@link "@academorix/notifications/types"} — {@link Notification}
 *    DTO, {@link NotificationChannel}, {@link NotificationStatus},
 *    {@link NotificationDataRef}. Field shape matches the Laravel
 *    backend one-for-one (snake_case included).
 *  - {@link "@academorix/notifications/preferences"} —
 *    {@link NotificationPreferences}, {@link QuietHoursWindow},
 *    {@link isDeliveryAllowed}, {@link isWithinQuietHours},
 *    {@link MANDATORY_PUSH_TYPES}.
 *  - {@link "@academorix/notifications/context"} —
 *    {@link createNotificationsContext} →
 *    `{ NotificationsProvider, useNotifications }`.
 *  - {@link "@academorix/notifications/push"} — Web Push helpers.
 *  - {@link "@academorix/notifications/hooks"} —
 *    {@link usePushSubscription}.
 *  - {@link "@academorix/notifications/service-worker"} — SW-side
 *    {@link handlePushEvent}, {@link handleNotificationClickEvent}.
 *
 * ## Backend contract
 *
 * The types in `types/` + `preferences/preferences.type.ts` mirror
 * the Laravel DTOs at:
 *
 *  - `backend/modules/Communication/src/Data/Notifications/NotificationData.php`
 *  - `backend/modules/Communication/src/Data/NotificationPreferences/NotificationPreferenceData.php`
 *
 * ## TODO — backend endpoints
 *
 * Read endpoints exist:
 *
 *  - `GET /notifications`, `GET /notifications/{id}`
 *  - `GET /notification-preferences`, `GET /notification-preferences/{id}`
 *
 * Write endpoints DO NOT exist yet. Consumers wire the calls with
 * TODO markers until the backend catches up:
 *
 *  - `POST /notifications/{id}/read` — mark one as read.
 *  - `POST /notifications/read-all` — mark all as read.
 *  - `POST /notifications/subscriptions` — register push endpoint.
 *  - `DELETE /notifications/subscriptions/{id}` — tear down push.
 *  - `PUT /notification-preferences` — update preferences.
 */

export type {
  Notification,
  NotificationChannel,
  NotificationDataRef,
  NotificationStatus,
} from "./types";

export { isDeliveryAllowed, isWithinQuietHours, MANDATORY_PUSH_TYPES } from "./preferences";
export type {
  IsDeliveryAllowedArgs,
  NotificationPreferences,
  PerChildPreferences,
  PreferenceDefaults,
  QuietHoursWindow,
} from "./preferences";

export { createNotificationsContext } from "./context";
export type {
  NotificationsContextBundle,
  NotificationsContextValue,
  NotificationsProviderProps,
} from "./context";

export {
  getExistingPushSubscription,
  isPushSupported,
  serializePushSubscription,
  subscribeToPush,
  unsubscribeFromPush,
  urlBase64ToUint8Array,
} from "./push";
export type { SerializedPushSubscription, SubscribeToPushOptions } from "./push";

export { usePushSubscription } from "./hooks";
export type { UsePushSubscriptionOptions, UsePushSubscriptionResult } from "./hooks";

export { handleNotificationClickEvent, handlePushEvent } from "./service-worker";

// ---------------------------------------------------------------------------
// NotificationTransportProvider — temporary passthrough shim.
//
// The barrel used to expose a top-level `<NotificationTransportProvider>`
// that wired in-app / web-push / native-OS delivery surfaces. The public
// API now composes through `createNotificationsContext()` (see above),
// but `apps/dashboard/src/App.tsx` still imports the old name. Ship a
// no-op passthrough so the dashboard boots; replace this once consumers
// migrate to the factory API or a fresh transport module is designed.
// ---------------------------------------------------------------------------
import type { ReactNode } from "react";

/** Props for the {@link NotificationTransportProvider} shim (children only). */
export interface NotificationTransportProviderProps {
  children: ReactNode;
}

/**
 * Passthrough shim — renders `children` unchanged. See the comment above
 * for the migration path once the real transport module lands.
 */
export function NotificationTransportProvider({ children }: NotificationTransportProviderProps) {
  return children;
}

// ---------------------------------------------------------------------------
// Dashboard consumer shims — temporary until the inbox surface lands.
//
// `apps/dashboard/src/modules/notifications/pages/{list,extra-0}.tsx` (and
// the retired `notification-bell.tsx`) import a batch of names that the
// full inbox module used to expose: rendering components (`NotificationTabs`,
// `NotificationPreferences`), a live-event bus hook, an inbox view-model
// hook, an action-registry hook, kind/channel icon resolvers, and default
// category / channel constants. None of those exist yet — this block ships
// no-op / empty-state stand-ins so the pages compile, load, and render an
// "empty inbox" state without a runtime `SyntaxError` at module import.
//
// Replace every shim with the real implementation once the notifications
// inbox lands. The dashboard call sites don't need to change — same names,
// same signatures.
// ---------------------------------------------------------------------------
import { createElement, useState } from "react";

/** Any array-shaped row the inbox operates on. Kept loose so consumers
 *  can pass their own `INotificationRecord` without a type import. */
type NotificationLike = Record<string, unknown> & { id: string | number };

/** Any action the inbox surfaces. Loose on purpose — see above. */
type NotificationActionLike = Record<string, unknown> & { id: string; label: string };

// ---------- Constants ----------------------------------------------------

/**
 * Placeholder for the category matrix used by the preferences surface.
 * The real value ships with the inbox module; consumers pass this array
 * verbatim to {@link NotificationPreferences}, so an empty array simply
 * renders no rows.
 */
export const DEFAULT_PREFERENCE_CATEGORIES: readonly {
  id: string;
  label: string;
  description?: string;
}[] = [];

/**
 * Placeholder for the channel columns used by the preferences surface.
 * Same story as {@link DEFAULT_PREFERENCE_CATEGORIES}.
 */
export const DEFAULT_PREFERENCE_CHANNELS: readonly { id: string; label: string }[] = [];

// ---------- Types --------------------------------------------------------

/** Handler map keyed by action id — the dashboard passes an empty
 *  object in until real handlers are wired up. */
export type NotificationActionHandlerMap = Record<
  string,
  (row: NotificationLike, action: NotificationActionLike) => void
>;

// ---------- Icon / colour resolvers -------------------------------------

/**
 * Map a channel token to the icon id the app should render. Falls back
 * to the generic `bell` glyph so an unknown channel still shows something
 * sensible.
 */
export function resolveNotificationChannelIcon(_channel: unknown): string {
  return "bell";
}

/**
 * Map a notification kind (`"payment"`, `"attendance"`, …) to the
 * design-system colour token consumers pass to `<Chip color={…}>`.
 * Defaults to the neutral tone until the real palette map lands.
 */
export function resolveNotificationKindColor(
  _kind: unknown,
): "default" | "success" | "warning" | "danger" | "accent" {
  return "default";
}

/**
 * Map a notification kind to its icon id. Falls back to `bell` for the
 * same reason as {@link resolveNotificationChannelIcon}.
 */
export function resolveNotificationKindIcon(_kind: unknown): string {
  return "bell";
}

// ---------- Hooks --------------------------------------------------------

/**
 * Live-event bus subscription — the real hook streams pushed notifications
 * into a merge queue the inbox reads alongside the durable rows. The shim
 * emits an empty stream so the inbox only shows the durable rows fetched
 * via Refine.
 */
export function useNotificationBus(): { events: readonly NotificationLike[] } {
  return { events: [] };
}

/**
 * View-model hook the inbox surface consumes. The real implementation
 * merges durable rows with live events, groups by kind, and computes the
 * tab breakdown + unread counts. The shim returns just the durable rows
 * unchanged; unread / tab machinery collapses to defaults.
 */
export function useNotificationInboxState({
  durable,
  liveEvents: _liveEvents,
}: {
  durable: readonly NotificationLike[];
  liveEvents?: readonly NotificationLike[];
}): {
  filtered: readonly NotificationLike[];
  unreadCount: number;
  totalCount: number;
  tabs: readonly { id: string; label: string; count: number }[];
  activeTab: string | null;
  setActiveTab: (next: string | null) => void;
} {
  const [activeTab, setActiveTab] = useState<string | null>(null);

  return {
    filtered: durable,
    unreadCount: 0,
    totalCount: durable.length,
    tabs: [],
    activeTab,
    setActiveTab,
  };
}

/**
 * Row-action registry — the real hook composes the dashboard's action
 * handlers with the built-in mark-read / dismiss / open behaviours.
 * The shim exposes stubs that call through to the caller-provided
 * navigation + mark-read handlers so those semantics still work; every
 * other action is a no-op until the real registry lands.
 */
export function useNotificationActions({
  onMarkRead,
  onNavigate,
}: {
  handlers?: NotificationActionHandlerMap;
  onMarkRead?: (row: NotificationLike) => void;
  onNavigate?: (url: string) => void;
}): {
  markRead: (row: NotificationLike) => void;
  dismiss: (row: NotificationLike) => void;
  openRow: (row: NotificationLike) => void;
  runAction: (row: NotificationLike, action: NotificationActionLike) => void;
} {
  return {
    markRead: (row) => onMarkRead?.(row),
    dismiss: () => {
      // no-op until the real dismiss endpoint exists
    },
    openRow: (row) => {
      const url = row.url as string | undefined;

      if (url) onNavigate?.(url);
    },
    runAction: () => {
      // no-op until the action registry ships
    },
  };
}

// ---------- Components --------------------------------------------------

/**
 * Segmented tab strip that lets the inbox filter by kind. The shim
 * renders nothing so the consumer's layout still flows; the real
 * component paints the tab strip once the inbox module ships. Props
 * intentionally loose — see the block-level comment above.
 */
export function NotificationTabs(_props: {
  tabs?: readonly unknown[];
  selectedKey?: string | null;
  onSelectionChange?: (next: string | null) => void;
  size?: "sm" | "md" | "lg";
}): null {
  return null;
}

/**
 * Preferences matrix (category × channel). Real component renders the
 * full switch grid; the shim shows only the `beforeMatrix` slot so the
 * dashboard-specific "Push on this device" card still renders. Once
 * the real component lands the matrix appears in its slot with zero
 * consumer changes.
 *
 * NOTE: exported as `NotificationPreferencesMatrix` to avoid a name
 * clash with the `NotificationPreferences` INTERFACE re-exported at
 * the top of this file. Aliased back to `NotificationPreferences`
 * for consumers that expect the older name (see the export-alias
 * `export { NotificationPreferencesMatrix as NotificationPreferences }`
 * at the very bottom of this file for a soft-migration hint).
 */
function NotificationPreferencesMatrixImpl({
  beforeMatrix,
}: {
  beforeMatrix?: unknown;
  categories?: readonly unknown[];
  channelColumns?: readonly unknown[];
  channels?: unknown;
  isLoading?: boolean;
  isSaving?: boolean;
  onToggle?: (category: string, channel: string) => void;
  renderIcon?: (iconId: string, props?: { className?: string; ariaHidden?: boolean }) => unknown;
}) {
  // Render only the caller's own slot content — the real matrix ships
  // with the inbox module. `createElement` (instead of JSX) keeps this
  // file a plain `.ts` module so the existing tsconfig / exports map
  // doesn't need adjusting.
  // `beforeMatrix` is typed as `unknown` for API flexibility (callers
  // may pass any renderable value); coerce to `ReactNode` for
  // `createElement`. The runtime accepts strings, numbers, nulls,
  // elements — the same set `ReactNode` names.
  return createElement(
    "div",
    { className: "flex flex-col gap-4" },
    (beforeMatrix ?? null) as ReactNode,
  );
}

// Alias exports — the impl is emitted once above under
// `NotificationPreferencesMatrixImpl`; consumers who import
// `NotificationPreferencesMatrix` (new name) or the shim-era
// `NotificationPreferences` (old name, kept for the migration
// window) both resolve to the same implementation. Splitting the
// declaration + export in two statements is what lets the TYPE
// re-export at the top of the file coexist with a VALUE export of
// the same identifier — TypeScript flags both as the same "variable"
// only when the declaration and the export share a name at the same
// site.
export const NotificationPreferencesMatrix = NotificationPreferencesMatrixImpl;
