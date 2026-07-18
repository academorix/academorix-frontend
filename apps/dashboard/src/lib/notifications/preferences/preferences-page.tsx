/**
 * @file preferences-page.tsx
 * @module notifications/preferences/preferences-page
 *
 * @description
 * `/notifications/preferences` — the Settings surface that exposes
 * the category × channel preference matrix, the quiet-hours window,
 * the global Do-Not-Disturb toggle, and (when push permission is
 * denied) a browser-specific re-enable panel with a "Test
 * notification" button.
 *
 * ## Data flow
 *
 *   - On mount: `GET /api/v1/notification-preferences` — read-only,
 *     exists today. We take the first row (the endpoint returns a
 *     paginated envelope but the current backend caps at one row per
 *     user).
 *   - Local edits are held in component state.
 *   - Save button: `PUT /api/v1/notification-preferences/{id}` —
 *     idempotent per user. Endpoint DOES NOT exist yet — the call
 *     is wired and silently swallows a 404/501 so the "save"
 *     experience feels normal once the endpoint ships.
 *
 * ## Why local state instead of Refine's `useUpdate`
 *
 * `useUpdate` requires a stable resource name in Refine's resource
 * registry. Notification preferences are a singleton per user (not
 * a CRUD resource) — modelling them as a resource would create
 * complications with `useOne`'s cache key. Direct HTTP is simpler
 * and plays cleanly with the Fetch layer we already own.
 *
 * TODO(backend-endpoint): PUT /api/v1/notification-preferences/{id}
 *   — endpoint does NOT exist yet. Payload: full
 *   `NotificationPreferences` DTO minus `id` / `updated_at`.
 *   Idempotent by user.
 *
 * ## Contextual push permission UX
 *
 * The Settings page is the correct place to prompt for push
 * permission the FIRST time (the drawer's banner covers the
 * click-through path; the Settings page covers users who came here
 * from onboarding). When the browser reports
 * `Notification.permission === "denied"`, we render a stable
 * recovery panel with per-browser re-enable instructions and a
 * "Test notification" button that surfaces a synthetic toast so
 * the user can verify the app renders alerts at all.
 */

import { isPushSupported } from "@academorix/notifications";
import { isQuietHoursWindow } from "@academorix/notifications/preferences";
import { Button, Separator, Switch } from "@stackra/ui/react";
import { toast } from "@stackra/ui/react";
import { useCallback, useEffect, useState } from "react";

import type { NotificationPreferences, QuietHoursWindow } from "@academorix/notifications";
import type { ReactNode } from "react";

import { EVENTS } from "@/config/analytics.config";
import {
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_ENDPOINTS,
  buildEndpointPath,
} from "@/config/notifications.config";
import { httpClient } from "@/lib/http";
import { unwrapEnvelope } from "@/lib/http/envelope";
import { ChannelToggle } from "@/lib/notifications/preferences/channel-toggle";
import { QuietHoursPicker } from "@/lib/notifications/preferences/quiet-hours-picker";
import { registerPush } from "@/lib/notifications/push/register-push";
import { emitNotificationTelemetry } from "@/lib/notifications/telemetry";

/** Channels the preferences page exposes. Deliberately narrower than */
/** `NotificationChannel` on the wire because our UI groups `in_app`. */
const UI_CHANNELS: readonly {
  readonly key: "in_app" | "push" | "email" | "sms" | "whatsapp";
  readonly label: string;
  readonly note?: string;
}[] = [
  { key: "in_app", label: "In-app" },
  { key: "push", label: "Push" },
  { key: "email", label: "Email" },
  { key: "sms", label: "SMS", note: "Availability depends on your tenant plan." },
  { key: "whatsapp", label: "WhatsApp", note: "Requires the WhatsApp integration." },
];

/** Endpoint we fetch on mount. Read-only, exists today. */
const PREFERENCES_ENDPOINT = NOTIFICATION_ENDPOINTS.preferences;

/**
 * Boot-time skeleton state for callers that mount the page before
 * the fetch completes. Uses defensive defaults consistent with the
 * DTO's nullable fields.
 */
function makeInitialPreferences(): NotificationPreferences {
  return {
    id: "np_pending",
    tenant_id: null,
    user_id: null,
    defaults: {},
    per_child: {},
    quiet_hours: {},
    updated_at: null,
  };
}

/**
 * Reads a boolean out of a preferences bag. `undefined` is coerced
 * to `true` (the module's default-allow rule).
 */
function readBool(bag: Record<string, unknown>, key: string): boolean {
  const value = bag[key];

  return value === undefined ? true : value !== false;
}

/** Loose browser classification used to pick recovery copy. */
type BrowserFamily = "chromium" | "firefox" | "safari" | "unknown";

/** Reads a very-rough browser family from `navigator.userAgent`. */
function detectBrowserFamily(): BrowserFamily {
  if (typeof navigator === "undefined") {
    return "unknown";
  }

  const ua = navigator.userAgent.toLowerCase();

  if (ua.includes("firefox")) {
    return "firefox";
  }

  if (ua.includes("edg/") || ua.includes("chrome") || ua.includes("chromium")) {
    return "chromium";
  }

  if (ua.includes("safari")) {
    return "safari";
  }

  return "unknown";
}

/**
 * Per-browser copy for re-enabling notifications after a deny. Kept
 * as short imperative bullets so the panel stays scannable.
 */
const REENABLE_INSTRUCTIONS: Readonly<Record<BrowserFamily, readonly string[]>> = {
  chromium: [
    "Click the padlock / tune icon in the address bar.",
    'Set "Notifications" to "Allow".',
    "Reload this page.",
  ],
  firefox: [
    "Click the padlock icon in the address bar.",
    'Under "Permissions" clear the "Blocked" state for Notifications.',
    "Reload this page.",
  ],
  safari: [
    "Open Safari → Settings → Websites → Notifications.",
    "Set this site's permission to Allow.",
    "Reload this page.",
  ],
  unknown: [
    "Open the site's permission settings from your browser's address bar.",
    "Change Notifications to Allow.",
    "Reload this page.",
  ],
};

/**
 * Reads the current `Notification.permission` value safely. Returns
 * `"unsupported"` when the browser has no Notification API.
 */
function readPermissionState(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined" || !isPushSupported()) {
    return "unsupported";
  }

  return Notification.permission;
}

/** Full-page settings view for notification preferences. */
export default function NotificationPreferencesPage(): ReactNode {
  const [preferences, setPreferences] = useState<NotificationPreferences>(makeInitialPreferences);
  const [isLoading, setLoading] = useState(true);
  const [isSaving, setSaving] = useState(false);
  const [dndEnabled, setDndEnabled] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission | "unsupported">(() =>
    readPermissionState(),
  );
  const [isEnablingPush, setEnablingPush] = useState(false);

  // ---- Fetch preferences on mount --------------------------------
  useEffect(() => {
    let cancelled = false;

    void (async (): Promise<void> => {
      try {
        const body = await httpClient.get<unknown>(PREFERENCES_ENDPOINT);
        const payload = unwrapEnvelope<NotificationPreferences | NotificationPreferences[]>(body);
        const record = Array.isArray(payload) ? payload[0] : payload;

        if (!cancelled && record) {
          setPreferences(record);
          setDndEnabled(readBool(record.defaults, "do_not_disturb") === false ? true : false);
        }
      } catch {
        // Endpoint returned nothing (e.g. fresh user) — keep the
        // skeleton state. `Save` will POST a new record when the
        // backend adds `create-if-missing` semantics to PUT.
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return (): void => {
      cancelled = true;
    };
  }, []);

  // ---- Reactive permission tracking ------------------------------
  //
  // A user might grant/deny push in another tab; polling every 5 s
  // keeps this page's copy accurate without spinning up a permission
  // event listener (Safari doesn't fire the `permissionchange`
  // event).
  useEffect(() => {
    if (pushPermission === "unsupported") {
      return;
    }

    const interval = window.setInterval(() => {
      setPushPermission(readPermissionState());
    }, 5000);

    return (): void => {
      window.clearInterval(interval);
    };
  }, [pushPermission]);

  // ---- Local mutation helpers ------------------------------------
  const setDefaultsField = useCallback((key: string, value: boolean | undefined): void => {
    setPreferences((current) => {
      const nextDefaults = { ...current.defaults } as Record<string, unknown>;

      if (value === undefined) {
        delete nextDefaults[key];
      } else {
        nextDefaults[key] = value;
      }

      return { ...current, defaults: nextDefaults };
    });
  }, []);

  const setQuietHours = useCallback((next: QuietHoursWindow): void => {
    setPreferences((current) => ({ ...current, quiet_hours: next }));
  }, []);

  const clearQuietHours = useCallback((): void => {
    setPreferences((current) => ({ ...current, quiet_hours: {} }));
  }, []);

  // ---- Save (PUT) -------------------------------------------------
  const handleSave = useCallback(async (): Promise<void> => {
    setSaving(true);

    // Fold the "DND on" state into `defaults.do_not_disturb` before
    // shipping — the backend DTO uses `defaults` as the single map
    // for scalar toggles.
    const nextDefaults = { ...preferences.defaults } as Record<string, unknown>;

    nextDefaults["do_not_disturb"] = dndEnabled;

    const payload = {
      defaults: nextDefaults,
      per_child: preferences.per_child,
      quiet_hours: preferences.quiet_hours,
    };

    // Fire an analytics event so we can measure intent even before
    // the endpoint lands.
    emitNotificationTelemetry(EVENTS.dndToggled, {
      dnd: dndEnabled,
    });

    try {
      // TODO(backend-endpoint): PUT /api/v1/notification-preferences/{id}
      //   — endpoint does NOT exist yet. Once shipped, this succeeds
      //   silently; today we swallow 404/501 so the user sees a
      //   "saved locally" affordance rather than an error toast.
      const path = buildEndpointPath(NOTIFICATION_ENDPOINTS.updatePreference, {
        id: preferences.id,
      });

      await httpClient.put(path, payload);

      toast.success("Preferences saved", {
        description: "Your changes are live for this account.",
      });
    } catch (err) {
      const status = (err as { statusCode?: number } | undefined)?.statusCode;

      if (status === 404 || status === 501) {
        // Backend gap — expected while the write endpoint is being
        // built. Surface a soft affordance rather than a red banner.
        toast.info("Preferences saved locally", {
          description:
            "Your changes are held in this browser tab. Server-side saving lands once the backend PUT endpoint ships.",
        });
      } else {
        toast.danger("Could not save preferences", {
          description: "Please retry in a moment. If the issue persists, contact support.",
        });
      }
    } finally {
      setSaving(false);
    }
  }, [preferences, dndEnabled]);

  // ---- Push permission actions -----------------------------------
  const handleEnablePush = useCallback(async (): Promise<void> => {
    setEnablingPush(true);
    emitNotificationTelemetry(EVENTS.notificationPermissionRequested, {
      surface: "settings_page",
    });

    try {
      const result = await registerPush();

      setPushPermission(readPermissionState());

      if (result.status === "subscribed" || result.status === "already_subscribed") {
        emitNotificationTelemetry(EVENTS.notificationPermissionGranted, {
          surface: "settings_page",
        });
        emitNotificationTelemetry(EVENTS.pushSubscriptionCreated, {
          surface: "settings_page",
        });
        toast.success("Push notifications enabled");
      } else if (result.status === "permission_denied") {
        emitNotificationTelemetry(EVENTS.notificationPermissionDenied, {
          surface: "settings_page",
        });
        toast.info("Push notifications remain disabled", {
          description: "You can enable them any time from this page.",
        });
      } else if (result.status === "no_registration") {
        toast.info("Push not available yet", {
          description:
            "The offline / push service worker is still installing. Reload the tab in a moment and try again.",
        });
      } else if (result.status === "unsupported") {
        toast.info("Push not supported on this browser", {
          description:
            "You'll still receive in-app and email notifications on the channels you've enabled below.",
        });
      }
    } finally {
      setEnablingPush(false);
    }
  }, []);

  /**
   * Fires a synthetic HeroUI toast to verify the app is rendering
   * alerts. Deliberately does NOT call the browser's Notification
   * API — the user is on this page precisely because the browser
   * refused permission, so showing an in-app toast is the useful
   * fallback signal.
   */
  const handleTestNotification = useCallback((): void => {
    toast.success("Test notification", {
      description:
        "In-app notifications are working. Push notifications will use the same look and feel once enabled.",
    });
  }, []);

  const quietHoursValue: QuietHoursWindow | null = isQuietHoursWindow(preferences.quiet_hours)
    ? preferences.quiet_hours
    : null;

  const browserFamily = detectBrowserFamily();
  const showDeniedPanel = pushPermission === "denied";
  const showEnablePanel = pushPermission === "default";
  const showSupportedPanel = pushPermission === "granted";

  return (
    <div className="flex flex-col gap-6 p-6" data-testid="notification-preferences-page">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-foreground">Notification preferences</h1>
        <p className="text-sm text-muted">
          Choose which categories reach you on which channels. Safety alerts always come through
          push — see the note on that row.
        </p>
      </header>

      <section
        className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4"
        data-testid="preferences-push-section"
      >
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold text-foreground">Browser push</h2>
          <p className="text-xs text-muted">
            Push notifications reach you when the app is closed or in the background.
          </p>
        </div>
        {showEnablePanel ? (
          <div
            className="flex items-center justify-between gap-3"
            data-testid="preferences-push-enable-panel"
          >
            <p className="text-sm text-muted">Push is off. Enable it to get instant alerts.</p>
            <Button
              aria-label="Enable push notifications"
              data-testid="preferences-push-enable-button"
              isDisabled={isEnablingPush}
              size="sm"
              variant="primary"
              onPress={() => {
                void handleEnablePush();
              }}
            >
              Enable push
            </Button>
          </div>
        ) : null}
        {showDeniedPanel ? (
          <div
            className="flex flex-col gap-2 rounded-lg border border-danger/40 bg-danger/5 p-3"
            data-testid="preferences-push-denied-panel"
          >
            <p className="text-sm font-medium text-foreground">Push is blocked for this site.</p>
            <p className="text-xs text-muted">
              You&apos;ll continue to receive in-app + email notifications. To re-enable push:
            </p>
            <ol className="ml-4 list-decimal text-xs text-muted">
              {REENABLE_INSTRUCTIONS[browserFamily].map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <div className="mt-1 flex justify-end">
              <Button
                aria-label="Send a test notification"
                data-testid="preferences-push-test-button"
                size="sm"
                variant="secondary"
                onPress={handleTestNotification}
              >
                Test notification
              </Button>
            </div>
          </div>
        ) : null}
        {showSupportedPanel ? (
          <div
            className="flex items-center justify-between gap-3"
            data-testid="preferences-push-supported-panel"
          >
            <p className="text-sm text-muted">Push is on for this browser.</p>
            <Button
              aria-label="Send a test notification"
              size="sm"
              variant="tertiary"
              onPress={handleTestNotification}
            >
              Test notification
            </Button>
          </div>
        ) : null}
      </section>

      <section className="flex flex-col gap-3" data-testid="preferences-dnd-section">
        <h2 className="text-base font-semibold text-foreground">Do not disturb</h2>
        <div className="flex items-start justify-between gap-4 rounded-xl border border-border bg-surface p-3">
          <div className="flex min-w-0 flex-col">
            <span className="text-sm font-medium text-foreground">Global do-not-disturb</span>
            <span className="mt-0.5 text-xs text-muted">
              Suppresses every notification except child-safety alerts. Toggling this here does not
              change your quiet-hours schedule.
            </span>
          </div>
          <Switch
            aria-label="Do not disturb"
            data-testid="preferences-dnd-switch"
            isSelected={dndEnabled}
            onChange={setDndEnabled}
          >
            <Switch.Content>
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
            </Switch.Content>
          </Switch>
        </div>
      </section>

      <Separator />

      <section className="flex flex-col gap-3" data-testid="preferences-quiet-hours-section">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold text-foreground">Quiet hours</h2>
          <p className="text-sm text-muted">
            Push notifications are held during this window; in-app entries still arrive.
          </p>
        </div>
        <QuietHoursPicker value={quietHoursValue} onChange={setQuietHours} />
        {quietHoursValue ? (
          <Button
            aria-label="Clear quiet hours"
            className="self-start"
            size="sm"
            variant="tertiary"
            onPress={clearQuietHours}
          >
            Clear quiet hours
          </Button>
        ) : null}
      </section>

      <Separator />

      <section className="flex flex-col gap-4" data-testid="preferences-categories-section">
        <h2 className="text-base font-semibold text-foreground">Categories</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {Object.entries(NOTIFICATION_CATEGORIES).map(([key, descriptor]) => {
            const categoryKey = key;

            return (
              <div
                key={categoryKey}
                className="flex flex-col gap-2"
                data-testid={`preferences-category-${categoryKey}`}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold text-foreground capitalize">
                    {categoryKey}
                  </span>
                  <span className="text-xs text-muted">
                    {descriptor.descriptionKey.replace(/\./g, " · ")}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {UI_CHANNELS.map((channel) => {
                    const key = `${categoryKey}.${channel.key}`;
                    // Safety category: `push` is always on and cannot be toggled.
                    const isMandatoryOn = categoryKey === "safety" && channel.key === "push";
                    const isEnabled = readBool(preferences.defaults, key);

                    return (
                      <ChannelToggle
                        key={key}
                        id={key}
                        isEnabled={isEnabled}
                        isMandatoryOn={isMandatoryOn}
                        label={channel.label}
                        note={
                          isMandatoryOn
                            ? "Always on — child-safety alerts bypass every filter."
                            : channel.note
                        }
                        onChange={(next) => setDefaultsField(key, next)}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <Separator />

      <footer className="flex items-center justify-end gap-2">
        <span className="text-xs text-muted" data-testid="preferences-save-note">
          {isLoading ? "Loading current preferences…" : ""}
        </span>
        <Button
          aria-label="Save preferences"
          data-testid="preferences-save-button"
          isDisabled={isLoading || isSaving}
          isPending={isSaving}
          onPress={() => {
            void handleSave();
          }}
        >
          Save preferences
        </Button>
      </footer>
    </div>
  );
}
