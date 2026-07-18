/**
 * @file extra-0.tsx
 * @module modules/notifications/pages/extra-0
 *
 * @description
 * `/notifications/preferences` — the notification opt-out surface
 * (§9.3). Composed of two pieces:
 *
 *   1. **`<BrowserPushSection>`** — a dashboard-specific "Push on
 *      this device" card driven by the {@link useFcm} hook. Lives
 *      in this file because FCM is scoped to the browser (device
 *      token + permission) rather than the account.
 *   2. **`<NotificationPreferences>`** — the foundation component
 *      that renders the category × channel matrix. Fed by
 *      Refine's `useOne`; changes are staged locally and persisted
 *      via `useUpdate` on Save.
 *
 * Category + channel rows come from the foundation defaults; the
 * dashboard can extend them later without touching the presentation
 * layer.
 */

import { Breadcrumbs, Button, Card, Chip, Switch, Tooltip } from "@heroui/react";
import { useNavigation, useNotification, useOne, useUpdate } from "@refinedev/core";
import { useEffect, useMemo, useState } from "react";

import type { BaseRecord } from "@refinedev/core";
import type { ReactNode } from "react";
// `LocalPreferenceMatrix` from `@academorix/contracts` uses
// the canonical `cells + defaults` shape which this WIP page has
// not been migrated to yet — the page still speaks the legacy flat
// map shape (see `LocalPreferenceMatrix` below).

import {
  DEFAULT_PREFERENCE_CATEGORIES,
  DEFAULT_PREFERENCE_CHANNELS,
  // Renamed at the source in the archived `packages/old/notifications`
  // to avoid a name clash with the `NotificationPreferences` interface
  // re-exported from the same barrel. Same underlying component.
  NotificationPreferencesMatrix as NotificationPreferences,
} from "@academorix/notifications";

import { Iconify } from "@/icons/iconify";
import { PageHeader } from "@/components/page-header";
import { useFcm } from "@/providers/fcm-provider";

/**
 * Persisted preferences record — mirrors the backend column
 * layout with an extra `digest` bag for future digest options.
 */
type PreferencesRecord = BaseRecord & {
  id: string;
  userId: string;
  channels: LocalPreferenceMatrix;
  digest?: {
    daily: boolean;
    weekly: boolean;
    quietHours?: { start: string; end: string };
  };
  updatedAt?: string;
};

/**
 * Local matrix shape — the legacy flat `Record<category, Record<
 * channel, boolean>>` layout this WIP page still speaks. The
 * canonical contract in `@academorix/contracts`
 * (`LocalPreferenceMatrix`) uses a `cells` + `defaults` shape
 * that this page has NOT been migrated to yet; kept as a local
 * override so the page compiles while the migration is scoped.
 *
 * TODO: rewrite the page to consume the canonical
 * `LocalPreferenceMatrix` shape then delete this alias.
 */
type LocalPreferenceMatrix = Record<string, Record<string, boolean>>;

/**
 * Fallback matrix used when the resource fetch is still in flight
 * or returns no data. Mirrors the mock fixture shape.
 */
const FALLBACK: LocalPreferenceMatrix = {
  payment: { "In-app": true, Email: true, Push: false, SMS: false },
  billing: { "In-app": true, Email: true, Push: false, SMS: false },
  attendance: { "In-app": true, Email: false, Push: true, SMS: false },
  roster: { "In-app": true, Email: false, Push: false, SMS: false },
  safeguarding: { "In-app": true, Email: true, Push: true, SMS: true },
  digest: { "In-app": false, Email: true, Push: false, SMS: false },
};

function serialize(matrix: LocalPreferenceMatrix): string {
  return JSON.stringify(matrix);
}

// -----------------------------------------------------------------------------
// Browser push section — dashboard-specific FCM card
// -----------------------------------------------------------------------------

/**
 * Copy used by the push-permission status subtitle. Kept in a
 * lookup so the render path stays flat and the strings are easy
 * to translate later.
 *
 * WHY: "denied" vs "unsupported" surface very different actions —
 * `denied` can be recovered by the user in browser settings,
 * whereas `unsupported` cannot be fixed at all. The copy makes
 * that difference explicit rather than lumping both under a
 * generic "unavailable".
 */
const PUSH_STATUS_COPY: Record<
  "enabled" | "granted-inactive" | "default" | "denied" | "unsupported",
  {
    label: string;
    description: string;
    chip: "success" | "warning" | "danger" | "default";
  }
> = {
  enabled: {
    label: "Enabled",
    description:
      "You'll get push notifications on this device even when Academorix is in the background.",
    chip: "success",
  },
  "granted-inactive": {
    label: "Not enabled",
    description:
      "Permission is granted — turn the switch on to start receiving push notifications here.",
    chip: "default",
  },
  default: {
    label: "Not enabled",
    description: "Turn on the switch to enable push notifications on this device.",
    chip: "default",
  },
  denied: {
    label: "Blocked",
    description:
      "This browser blocked notifications. Enable them in your browser settings, then reload this page.",
    chip: "danger",
  },
  unsupported: {
    label: "Unsupported",
    description: "This browser doesn't support the push notifications the Academorix backend uses.",
    chip: "default",
  },
};

/**
 * "Push notifications on this device" section rendered above the
 * category × channel matrix. Reads FCM state from {@link useFcm}
 * and toggles the subscription with a single switch.
 *
 * WHY split out: the parent page component is already substantial,
 * and the push section has its own state shape + disabled logic.
 * Colocating everything in `Page()` would make both harder to
 * reason about.
 */
function BrowserPushSection(): ReactNode {
  const { permission, token, isSupported, isSubscribing, subscribe, unsubscribe } = useFcm();

  // WHY: "enabled" means BOTH a token is stored AND permission is
  // granted. Either alone is a bad signal — a stale token without
  // permission would render a lie, and a permission grant without
  // a token means the user never actually opted in on this device.
  const isEnabled = permission === "granted" && token !== null;

  // Derive the human-readable status. Order matters: unsupported >
  // denied > granted-with-token > granted-without-token > default.
  const statusKey: keyof typeof PUSH_STATUS_COPY = !isSupported
    ? "unsupported"
    : permission === "denied"
      ? "denied"
      : permission === "granted"
        ? isEnabled
          ? "enabled"
          : "granted-inactive"
        : "default";
  const status = PUSH_STATUS_COPY[statusKey];

  const isSwitchDisabled = !isSupported || permission === "denied" || isSubscribing;

  const handleChange = (next: boolean): void => {
    if (next === isEnabled) return;
    void (next ? subscribe() : unsubscribe());
  };

  const tooltipLabel = !isSupported
    ? "Push notifications aren't available on this browser."
    : permission === "denied"
      ? "Notifications are blocked in your browser settings."
      : null;

  const switchNode = (
    <Switch
      aria-label="Enable push notifications on this device"
      isDisabled={isSwitchDisabled}
      isSelected={isEnabled}
      onChange={handleChange}
    >
      <Switch.Content>
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
      </Switch.Content>
    </Switch>
  );

  return (
    <Card>
      <Card.Content className="flex flex-col gap-4 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-default/20 text-muted">
              <Iconify className="size-4" icon="mobile" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                Push notifications on this device
                <Chip color={status.chip} size="sm" variant="soft">
                  <Chip.Label>{status.label}</Chip.Label>
                </Chip>
              </div>
              <p className="mt-0.5 text-xs text-muted">{status.description}</p>
            </div>
          </div>
          {tooltipLabel ? (
            <Tooltip>
              {switchNode}
              <Tooltip.Content>{tooltipLabel}</Tooltip.Content>
            </Tooltip>
          ) : (
            switchNode
          )}
        </div>

        {permission === "denied" ? (
          <div className="flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/5 p-3">
            <Iconify
              aria-hidden
              className="mt-0.5 size-4 shrink-0 text-danger"
              icon="circle-exclamation"
            />
            <div className="min-w-0 text-xs text-muted">
              <p className="text-sm font-medium text-foreground">Notifications are blocked</p>
              <p className="mt-0.5">
                Enable notifications for this site in your browser settings, then reload the page.
                In Chrome, that's{" "}
                <span className="font-medium text-foreground">
                  Settings → Privacy and security → Site settings → Notifications
                </span>
                .
              </p>
            </div>
          </div>
        ) : null}
      </Card.Content>
    </Card>
  );
}

// -----------------------------------------------------------------------------
// Preferences page
// -----------------------------------------------------------------------------

const renderIcon = (iconId: string, props?: { className?: string; ariaHidden?: boolean }) => (
  <Iconify aria-hidden={props?.ariaHidden} className={props?.className} icon={iconId} />
);

export default function Page() {
  const { list } = useNavigation();
  const { open: notify } = useNotification();

  const { result, query } = useOne<PreferencesRecord>({
    resource: "notification-preferences",
    id: "me",
  });
  const { mutate: updateOne, mutation } = useUpdate<PreferencesRecord>();

  const isLoading = query.isLoading;
  const remote = result;

  const [prefs, setPrefs] = useState<LocalPreferenceMatrix>(remote?.channels ?? FALLBACK);
  const [baseline, setBaseline] = useState<LocalPreferenceMatrix>(
    remote?.channels ?? FALLBACK,
  );

  useEffect(() => {
    if (!remote?.channels) return;
    setPrefs(remote.channels);
    setBaseline(remote.channels);
  }, [remote?.channels]);

  const isDirty = useMemo(() => serialize(prefs) !== serialize(baseline), [prefs, baseline]);

  const toggle = (category: string, channel: string) => {
    // Safeguarding is hard-required — the foundation component
    // already disables the switches but guard the mutation path
    // too for defense in depth.
    if (category === "safeguarding") return;
    setPrefs((prev) => {
      const next: LocalPreferenceMatrix = { ...prev };
      const row = { ...(prev[category] ?? FALLBACK[category] ?? {}) };
      row[channel] = !(prev[category]?.[channel] ?? false);
      next[category] = row;
      return next;
    });
  };

  const resetPrefs = () => {
    setPrefs(baseline);
  };

  const savePrefs = () => {
    updateOne(
      {
        resource: "notification-preferences",
        id: "me",
        values: {
          channels: prefs,
          updatedAt: new Date().toISOString(),
        },
        mutationMode: "optimistic",
      },
      {
        onSuccess: () => {
          setBaseline(prefs);
          notify?.({
            key: `notif-prefs-save-${Date.now()}`,
            message: "Preferences saved",
            description: "Your notification settings will apply to all new events.",
            type: "success",
          });
        },
        onError: () => {
          notify?.({
            key: `notif-prefs-error-${Date.now()}`,
            message: "Could not save preferences",
            description: "Something went wrong on our side. Please try again.",
            type: "error",
          });
        },
      },
    );
  };

  const isSaving = mutation.isPending;

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs>
        <Breadcrumbs.Item href="/">Home</Breadcrumbs.Item>
        <Breadcrumbs.Item href="/notifications">Notifications</Breadcrumbs.Item>
        <Breadcrumbs.Item>Preferences</Breadcrumbs.Item>
      </Breadcrumbs>

      <PageHeader
        actions={
          <>
            <Button onPress={() => list("notifications")} variant="ghost">
              <Iconify className="size-4" icon="arrow-left" />
              Back to inbox
            </Button>
            <Button isDisabled={!isDirty || isSaving} onPress={resetPrefs} variant="ghost">
              <Iconify className="size-4" icon="arrow-uturn-left" />
              Discard
            </Button>
            <Button
              isDisabled={!isDirty || isSaving}
              isPending={isSaving}
              onPress={savePrefs}
              variant="primary"
            >
              <Iconify className="size-4" icon="check" />
              Save preferences
            </Button>
          </>
        }
        description="Choose how you receive each category of notification. Safeguarding events cannot be silenced."
        title="Notification preferences"
      />

      {isDirty ? (
        <Chip color="warning" size="sm" variant="soft">
          <Iconify className="size-3" icon="circle-exclamation" />
          <Chip.Label>You have unsaved changes.</Chip.Label>
        </Chip>
      ) : null}

      <NotificationPreferences
        beforeMatrix={<BrowserPushSection />}
        categories={DEFAULT_PREFERENCE_CATEGORIES}
        channelColumns={DEFAULT_PREFERENCE_CHANNELS}
        channels={prefs}
        isLoading={isLoading}
        isSaving={isSaving}
        onToggle={toggle}
        renderIcon={renderIcon}
      />
    </div>
  );
}
