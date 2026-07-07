/**
 * @file preferences-page.tsx
 * @module notifications/preferences/preferences-page
 *
 * @description
 * `/notifications/preferences` — the Settings surface that exposes
 * the category × channel preference matrix, the quiet-hours window,
 * and the global Do-Not-Disturb toggle.
 *
 * ## Data flow
 *
 *   - Reads the current preferences via `GET /notification-preferences`
 *     (endpoint exists, read-only).
 *   - Local edits are held in component state; a Save button PUTs the
 *     payload once the user is happy.
 *   - The PUT endpoint does NOT exist yet — we wire the button + toast
 *     the payload to the console for now (see TODOs below).
 *
 * ## Why local state instead of Refine's `useUpdate`
 *
 * `useUpdate` requires a stable resource name in Refine's resource
 * registry. Notification preferences are a singleton per user (not a
 * CRUD resource) — modeling them as a resource would create
 * complications with `useOne`'s cache key. Direct HTTP is simpler and
 * plays cleanly with the Fetch layer we already own.
 *
 * TODO(backend-gap): PUT /notification-preferences — endpoint does NOT
 *   exist yet. Payload: full `NotificationPreferences` DTO minus `id`
 *   / `updated_at`. Idempotent by user.
 */

import { isQuietHoursWindow } from "@academorix/notifications/preferences";
import { Button, Separator, Switch } from "@academorix/ui/react";
import { toast } from "@academorix/ui/react";
import { useCallback, useEffect, useState } from "react";

import type { NotificationPreferences, QuietHoursWindow } from "@academorix/notifications";
import type { ReactNode } from "react";

import { EVENTS } from "@/config/analytics.config";
import { NOTIFICATION_CATEGORIES } from "@/config/notifications.config";
import { httpClient } from "@/lib/http";
import { unwrapEnvelope } from "@/lib/http/envelope";
import { ChannelToggle } from "@/notifications/preferences/channel-toggle";
import { QuietHoursPicker } from "@/notifications/preferences/quiet-hours-picker";
import { emitNotificationTelemetry } from "@/notifications/telemetry";

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
const PREFERENCES_ENDPOINT = "/notification-preferences";

/**
 * Boot-time skeleton state for callers that mount the page before the
 * fetch completes. Uses defensive defaults consistent with the
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
 * Reads a boolean out of a preferences bag. `undefined` is coerced to
 * `true` (the module's default-allow rule).
 */
function readBool(bag: Record<string, unknown>, key: string): boolean {
  const value = bag[key];

  return value === undefined ? true : value !== false;
}

/** Full-page settings view for notification preferences. */
export default function NotificationPreferencesPage(): ReactNode {
  const [preferences, setPreferences] = useState<NotificationPreferences>(makeInitialPreferences);
  const [isLoading, setLoading] = useState(true);
  const [isSaving, setSaving] = useState(false);
  const [dndEnabled, setDndEnabled] = useState(false);

  // Fetch on mount.
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
        // backend adds a `create-if-missing` semantics to PUT.
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

  const handleSave = useCallback(async (): Promise<void> => {
    setSaving(true);

    try {
      // TODO(backend-gap): PUT /notification-preferences — endpoint
      //   does NOT exist yet. Once shipped, remove this branch and
      //   let httpClient.put propagate.
      const { id: _id, updated_at: _updated_at, ...payload } = preferences;

      void _id;
      void _updated_at;
      void payload;

      // Fire an analytics event so we can measure intent even before
      // the endpoint lands.
      emitNotificationTelemetry(EVENTS.dndToggled, {
        dnd: dndEnabled,
      });

      toast.info("Preferences saved locally", {
        description:
          "Your changes are held in this browser tab. Server-side saving lands once the backend PUT endpoint ships.",
      });
    } finally {
      setSaving(false);
    }
  }, [preferences, dndEnabled]);

  const quietHoursValue: QuietHoursWindow | null = isQuietHoursWindow(preferences.quiet_hours)
    ? preferences.quiet_hours
    : null;

  return (
    <div className="flex flex-col gap-6 p-6" data-testid="notification-preferences-page">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-foreground">Notification preferences</h1>
        <p className="text-sm text-muted">
          Choose which categories reach you on which channels. Safety alerts always come through
          push — see the note on that row.
        </p>
      </header>

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
