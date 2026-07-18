/**
 * @file share-dashboard-dialog.tsx
 * @module modules/dashboard/components/share-dashboard-dialog
 *
 * @description
 * Modal that manages dashboard sharing in two independent axes:
 *
 *  1. **Who can see this dashboard in-app** — controlled by
 *     {@link Dashboard.shareLevel}. Applies to authenticated tenant
 *     members browsing the app; the sidebar / palette / listing
 *     surfaces all consult this. Three modes:
 *     * `private` — only the owner sees the dashboard in-app.
 *     * `shared` — every tenant member sees it.
 *     * `role-restricted` — only viewers matched by a persisted
 *       {@link DashboardShareGrant} see it (by role slug, user id,
 *       or the `everyone` sentinel).
 *  2. **Public embed links** — controlled by
 *     {@link Dashboard.visibility}. Embed links bypass the in-app
 *     `shareLevel` rules and are publicly reachable, so the two
 *     axes are surfaced independently.
 *
 * The dialog is composed of two sections:
 *
 *   * **Who can see this dashboard** (this file's new home) — radio
 *     group over the three share levels + a grants editor when
 *     `role-restricted` is selected.
 *   * **Embed links** — the historical flow: issue, copy, revoke
 *     a rotated public token when the dashboard is `shared`.
 */

import {
  Button,
  Chip,
  Description,
  Disclosure,
  DisclosureGroup,
  Dropdown,
  Input,
  Label,
  ListBox,
  Modal,
  Radio,
  RadioGroup,
  Select,
  Separator,
  Switch,
  TextArea,
  TextField,
  Tooltip,
  toast,
} from "@heroui/react";
import { useGetIdentity } from "@refinedev/core";
import { useCallback, useEffect, useMemo, useState } from "react";

import type {
  BroadcastTemplate,
  BroadcastViewLogRecord,
  BulkRevokeFilters,
  Dashboard,
  DashboardShareGrant,
  DashboardShareLevel,
  EmbedTokenRecord,
  IssueEmbedTokenInput,
  IssuedEmbedToken,
  UseDashboardsResult,
} from "@/modules/dashboard/dashboards";
import type { Identity } from "@/refine/auth-provider";
import type { Key, ReactNode } from "react";

import { Iconify } from "@/icons/iconify";
import { dashboardStorage } from "@/modules/dashboard/dashboards";

/**
 * Hard-coded playground roles. Replaced by the tenant's real role
 * table when the auth surface lands — the shape stays the same.
 */
const PLAYGROUND_ROLES: readonly { slug: string; label: string }[] = [
  { slug: "admin", label: "Admins" },
  { slug: "coach", label: "Coaches" },
  { slug: "athlete", label: "Athletes" },
  { slug: "staff", label: "Staff" },
  { slug: "parent", label: "Parents" },
];

/**
 * Hard-coded playground users. The first entry matches the singleton
 * `playground-user` synthesised by the storage adapter so an
 * owner-granted-to-themselves case renders sensibly.
 */
const PLAYGROUND_USERS: readonly { id: string; label: string; email: string }[] = [
  { id: "playground-user", label: "Alex Morgan", email: "alex@academorix.demo" },
  { id: "user-taylor-reed", label: "Taylor Reed", email: "taylor@academorix.demo" },
  { id: "user-jordan-blake", label: "Jordan Blake", email: "jordan@academorix.demo" },
  { id: "user-morgan-lee", label: "Morgan Lee", email: "morgan@academorix.demo" },
  { id: "user-sam-chen", label: "Sam Chen", email: "sam@academorix.demo" },
];

/**
 * Iconify tokens surfaced by the "Save as template" modal. Kept
 * intentionally short (12 entries) so the picker fits on one row
 * without scrolling — mirrors the ICON_CHOICES list in
 * `customize-panel.tsx` (task requirement).
 */
const TEMPLATE_ICON_CHOICES: readonly string[] = [
  "square-check",
  "chart-column",
  "chart-line",
  "circle-dollar",
  "persons",
  "person",
  "clock",
  "star",
  "shield-check",
  "rocket",
  "layers",
  "sparkles",
];

/**
 * Selectable grace-period values (in seconds) exposed by the
 * rotation modal. Kept as a static tuple so the copy in each option
 * label stays consistent with the numeric value shipped to the
 * backend. The dropdown defaults to 24h — matches the spec.
 */
const ROTATION_GRACE_CHOICES: readonly { value: number; label: string }[] = [
  { value: 3600, label: "1 hour" },
  { value: 21_600, label: "6 hours" },
  { value: 86_400, label: "24 hours" },
  { value: 259_200, label: "3 days" },
  { value: 604_800, label: "7 days" },
];

/**
 * Convert a stringified refresh cadence (matching the base form's
 * `refreshChoice` value) back to a millisecond value for
 * `IssueEmbedTokenInput.refreshMs`. Mirrors the helper on the main
 * dialog body so template application can reuse the same choice
 * enum without duplicating math.
 */
function refreshMsFromChoiceLiteral(
  choice: "off" | "10s" | "30s" | "1m" | "5m" | "15m" | "1h",
): number | undefined {
  switch (choice) {
    case "off":
      return undefined;
    case "10s":
      return 10_000;
    case "30s":
      return 30_000;
    case "1m":
      return 60_000;
    case "5m":
      return 300_000;
    case "15m":
      return 900_000;
    case "1h":
      return 3_600_000;
  }
}

/**
 * Reverse of {@link refreshMsFromChoiceLiteral}. Snaps a persisted
 * `refreshMs` back to the closest choice enum so a template
 * targeting `500 ms` doesn't crash the select — it clamps to the
 * nearest human-facing tier.
 */
function refreshChoiceFromMs(
  refreshMs: number | undefined,
): "off" | "10s" | "30s" | "1m" | "5m" | "15m" | "1h" {
  if (refreshMs === undefined || refreshMs <= 0) return "off";
  if (refreshMs <= 15_000) return "10s";
  if (refreshMs <= 45_000) return "30s";
  if (refreshMs <= 90_000) return "1m";
  if (refreshMs <= 450_000) return "5m";
  if (refreshMs <= 1_800_000) return "15m";
  return "1h";
}

/**
 * Deterministic sort-order key for the "Existing links" list —
 * newest first, revoked / superseded rows to the bottom. The list
 * groups by visual state before creation time so the operator
 * always sees the actionable rows at the top.
 */
function tokenRowRank(token: EmbedTokenRecord): number {
  if (token.revokedAt) return 2;
  if (token.supersededByTokenId) return 1;

  return 0;
}

/**
 * Composite key format for the "add grant" Select. Encoded as
 * `<targetType>:<targetId>` so the ListBox `id` remains a single
 * string while the caller can round-trip back to the full triple.
 * `everyone` uses the literal `everyone:*`.
 */
type SelectOptionKey = `role:${string}` | `user:${string}` | "everyone:*";

interface SelectOption {
  key: SelectOptionKey;
  targetType: DashboardShareGrant["targetType"];
  targetId: string;
  targetLabel: string;
}

/**
 * Enumerate every pickable grant target, grouped for the ListBox.
 * Kept as a plain array (rather than a Map or object) so
 * ordering stays predictable.
 */
const EVERYONE_OPTION: SelectOption = {
  key: "everyone:*",
  targetType: "everyone",
  targetId: "*",
  targetLabel: "Everyone in the tenant",
};

const ROLE_OPTIONS: readonly SelectOption[] = PLAYGROUND_ROLES.map((role) => ({
  key: `role:${role.slug}` as const,
  targetType: "role" as const,
  targetId: role.slug,
  targetLabel: role.label,
}));

const USER_OPTIONS: readonly SelectOption[] = PLAYGROUND_USERS.map((user) => ({
  key: `user:${user.id}` as const,
  targetType: "user" as const,
  targetId: user.id,
  targetLabel: user.label,
}));

/** Component-level lookup: composite key → option descriptor. */
const OPTION_BY_KEY: ReadonlyMap<SelectOptionKey, SelectOption> = new Map([
  [EVERYONE_OPTION.key, EVERYONE_OPTION],
  ...ROLE_OPTIONS.map((option) => [option.key, option] as const),
  ...USER_OPTIONS.map((option) => [option.key, option] as const),
]);

/**
 * Split a user-typed multi-line / comma-separated list into a
 * trimmed, deduped array. Empty entries are dropped so the operator
 * can paste an allowlist verbatim without hand-cleaning it first.
 */
function parseList(raw: string): readonly string[] {
  if (!raw.trim()) return [];

  const parts = raw
    .split(/[\n,]+/g)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

  return Array.from(new Set(parts));
}

export interface ShareDashboardDialogProps {
  dashboard: Dashboard | null;
  registry: UseDashboardsResult;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareDashboardDialog({
  dashboard,
  registry,
  isOpen,
  onOpenChange,
}: ShareDashboardDialogProps): ReactNode {
  // ---------------------------------------------------------------------
  // Embed-token state — the historical share-links flow.
  // ---------------------------------------------------------------------
  const [tokens, setTokens] = useState<readonly EmbedTokenRecord[]>([]);
  const [label, setLabel] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [justIssued, setJustIssued] = useState<IssuedEmbedToken | null>(null);
  const [isLoadingTokens, setLoadingTokens] = useState(false);

  // ---------------------------------------------------------------------
  // Broadcast Phase-1 fields — every one is optional so a bare
  // "create link" click still mints a plain chromeless embed. The
  // dashboard row only surfaces these controls when the caller
  // opens the Presentation tab.
  // ---------------------------------------------------------------------
  const [broadcastKind, setBroadcastKind] = useState<"embed" | "present">("embed");
  const [broadcastPassword, setBroadcastPassword] = useState("");
  const [refreshChoice, setRefreshChoice] = useState<
    "off" | "10s" | "30s" | "1m" | "5m" | "15m" | "1h"
  >("off");
  const [rotationSeconds, setRotationSeconds] = useState<number>(30);

  // ---------------------------------------------------------------------
  // Broadcast Phase-2 — access controls. Each list is edited as a
  // raw newline-delimited textarea so the operator can paste a CIDR
  // block / referer list / email dump verbatim; `parseList` splits
  // on newlines + commas at submit time.
  // ---------------------------------------------------------------------
  const [ipAllowlistText, setIpAllowlistText] = useState("");
  const [refererAllowlistText, setRefererAllowlistText] = useState("");
  const [viewerEmailAllowlistText, setViewerEmailAllowlistText] = useState("");
  const [viewerDomainAllowlistText, setViewerDomainAllowlistText] = useState("");
  const [maxUsesText, setMaxUsesText] = useState("");

  // ---------------------------------------------------------------------
  // Broadcast Phase-3 — data protection. Watermark text mirrors the
  // spec's `{brand}·{date}` default; the toggle is the source of
  // truth for whether the overlay renders.
  // ---------------------------------------------------------------------
  const [watermarkEnabled, setWatermarkEnabled] = useState(false);
  const [watermarkText, setWatermarkText] = useState("{brand}·{date}");
  const [disableCopy, setDisableCopy] = useState(false);
  const [piiMask, setPiiMask] = useState(false);
  const [dataWindowFrom, setDataWindowFrom] = useState("");
  const [dataWindowTo, setDataWindowTo] = useState("");

  // ---------------------------------------------------------------------
  // Broadcast Phase-4 — whitelabel branding. Every field is optional;
  // the viewer falls back to Academorix branding when nothing is set.
  // ---------------------------------------------------------------------
  const [whitelabelLogoUrl, setWhitelabelLogoUrl] = useState("");
  const [whitelabelAccent, setWhitelabelAccent] = useState("");
  const [whitelabelWelcomeText, setWhitelabelWelcomeText] = useState("");

  // ---------------------------------------------------------------------
  // Broadcast Phase-7 — template picker. `appliedTemplate` is a
  // display-only mirror of the last picked template so we can render
  // a "From: {name}" chip next to the picker. Setting the picker
  // Select to `null` clears the chip.
  // ---------------------------------------------------------------------
  const [appliedTemplate, setAppliedTemplate] = useState<BroadcastTemplate | null>(null);
  const [isSaveTemplateOpen, setSaveTemplateOpen] = useState(false);
  const [templateNameInput, setTemplateNameInput] = useState("");
  const [templateDescriptionInput, setTemplateDescriptionInput] = useState("");
  const [templateIconInput, setTemplateIconInput] = useState<string | undefined>(undefined);
  const [templateIsSharedInput, setTemplateIsSharedInput] = useState(false);

  // ---------------------------------------------------------------------
  // Broadcast Phase-7 — rotation modal. `rotateTarget` mirrors the
  // token whose row menu the operator just clicked; the modal only
  // renders when it's set. `rotateGrace` defaults to 24 hours.
  // ---------------------------------------------------------------------
  const [rotateTarget, setRotateTarget] = useState<EmbedTokenRecord | null>(null);
  const [rotateGraceSeconds, setRotateGraceSeconds] = useState<number>(86_400);
  const [rotateIssued, setRotateIssued] = useState<IssuedEmbedToken | null>(null);

  // ---------------------------------------------------------------------
  // Broadcast Phase-7 — bulk revoke modal.
  // ---------------------------------------------------------------------
  const [isBulkRevokeOpen, setBulkRevokeOpen] = useState(false);

  // ---------------------------------------------------------------------
  // Broadcast Phase-6 — audit log. Loaded lazily when the operator
  // opens the "Activity" collapsible; kept as an object keyed by
  // embed-token id so switching between tokens without collapsing
  // the section doesn't force a re-fetch we already have.
  // ---------------------------------------------------------------------
  const [activeAuditTokenId, setActiveAuditTokenId] = useState<string | null>(null);
  const [auditLogByToken, setAuditLogByToken] = useState<
    Record<string, readonly BroadcastViewLogRecord[]>
  >({});
  const [isLoadingAuditLog, setLoadingAuditLog] = useState(false);

  // ---------------------------------------------------------------------
  // Share-grant state — enumerates access grants for the current
  // dashboard when its `shareLevel === "role-restricted"`. Reloaded
  // whenever the dialog opens or a grant mutation lands.
  // ---------------------------------------------------------------------
  const [grants, setGrants] = useState<readonly DashboardShareGrant[]>([]);
  const [isLoadingGrants, setLoadingGrants] = useState(false);
  const [pendingGrantKey, setPendingGrantKey] = useState<SelectOptionKey | null>(null);

  // Local mirror of the dashboard's share level. Kept as state so
  // the radio flips optimistically while the underlying update
  // request is in flight — the effect below re-syncs when the
  // dashboard prop identity or version changes.
  const [shareLevel, setShareLevel] = useState<DashboardShareLevel>(
    dashboard?.shareLevel ?? "private",
  );

  useEffect(() => {
    if (dashboard) {
      setShareLevel(dashboard.shareLevel);
    }
  }, [dashboard]);

  // ---------------------------------------------------------------------
  // Loaders — one per store. Kept independent so a slow grant read
  // doesn't stall the token list, and vice versa.
  // ---------------------------------------------------------------------

  const reloadTokens = useCallback(async () => {
    if (!dashboard) {
      setTokens([]);

      return;
    }

    setLoadingTokens(true);
    try {
      const list = await dashboardStorage.listEmbedTokens(dashboard.id);

      setTokens(list);
    } finally {
      setLoadingTokens(false);
    }
  }, [dashboard]);

  const reloadGrants = useCallback(async () => {
    if (!dashboard) {
      setGrants([]);

      return;
    }

    setLoadingGrants(true);
    try {
      const list = await registry.listShareGrants(dashboard.id);

      setGrants(list);
    } finally {
      setLoadingGrants(false);
    }
  }, [dashboard, registry]);

  useEffect(() => {
    if (isOpen) {
      void reloadTokens();
      void reloadGrants();
    } else {
      // Reset transient form state so a reopened dialog starts
      // fresh. Persistent state (grants, tokens) is left alone —
      // the reload effect above handles the refresh.
      setJustIssued(null);
      setLabel("");
      setExpiresAt("");
      setPendingGrantKey(null);
      setBroadcastKind("embed");
      setBroadcastPassword("");
      setRefreshChoice("off");
      setRotationSeconds(30);
      // Phase-2 access controls
      setIpAllowlistText("");
      setRefererAllowlistText("");
      setViewerEmailAllowlistText("");
      setViewerDomainAllowlistText("");
      setMaxUsesText("");
      // Phase-3 data protection
      setWatermarkEnabled(false);
      setWatermarkText("{brand}·{date}");
      setDisableCopy(false);
      setPiiMask(false);
      setDataWindowFrom("");
      setDataWindowTo("");
      // Phase-4 whitelabel
      setWhitelabelLogoUrl("");
      setWhitelabelAccent("");
      setWhitelabelWelcomeText("");
      // Phase-7 template + rotation + bulk state — reset every
      // stashed selection so a reopened dialog starts fresh.
      setAppliedTemplate(null);
      setSaveTemplateOpen(false);
      setTemplateNameInput("");
      setTemplateDescriptionInput("");
      setTemplateIconInput(undefined);
      setTemplateIsSharedInput(false);
      setRotateTarget(null);
      setRotateGraceSeconds(86_400);
      setRotateIssued(null);
      setBulkRevokeOpen(false);
      // Phase-6 audit-log
      setActiveAuditTokenId(null);
      setAuditLogByToken({});
    }
  }, [isOpen, reloadTokens, reloadGrants]);

  // Permission check for the "Bulk actions" affordance — mirrors the
  // backend guard on `POST /api/dashboards/embed-tokens/bulk-revoke`.
  // The playground identity carries `"*"` so the button always shows;
  // production callers with a scoped permission list only see it
  // when `dashboards.manage` is granted.
  const { data: identity } = useGetIdentity<Identity>();
  const canBulkManage = useMemo(() => {
    const perms = identity?.permissions ?? [];

    return perms.includes("*") || perms.includes("dashboards.manage");
  }, [identity]);

  // -----------------------------------------------------------------------
  // Phase-6 audit log loader — declared BEFORE the early-return
  // below so the hook order stays stable across renders that hit
  // the null-dashboard branch.
  // -----------------------------------------------------------------------
  const loadAuditLog = useCallback(
    async (tokenId: string) => {
      setLoadingAuditLog(true);
      try {
        const rows = await registry.listBroadcastViewLog(tokenId);

        setAuditLogByToken((prev) => ({ ...prev, [tokenId]: rows }));
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : "Could not load activity.";

        toast.danger("Activity unavailable", { description: message });
      } finally {
        setLoadingAuditLog(false);
      }
    },
    [registry],
  );

  useEffect(() => {
    if (activeAuditTokenId && !(activeAuditTokenId in auditLogByToken)) {
      void loadAuditLog(activeAuditTokenId);
    }
  }, [activeAuditTokenId, auditLogByToken, loadAuditLog]);

  // Grant keys already applied — used to hide options in the
  // picker so the operator doesn't accidentally submit a duplicate.
  // Duplicate submits are also idempotent at the storage layer, but
  // hiding the option is friendlier. Declared BEFORE the early
  // return below so the hook order stays stable across renders that
  // hit the null-dashboard branch.
  const grantedKeys = useMemo<ReadonlySet<SelectOptionKey>>(() => {
    const set = new Set<SelectOptionKey>();

    for (const grant of grants) {
      const key: SelectOptionKey =
        grant.targetType === "everyone"
          ? "everyone:*"
          : (`${grant.targetType}:${grant.targetId}` as SelectOptionKey);

      set.add(key);
    }

    return set;
  }, [grants]);

  if (!dashboard) {
    return null;
  }

  const canShare = dashboard.visibility === "shared";
  const isRestricted = shareLevel === "role-restricted";

  // -----------------------------------------------------------------------
  // Share-level mutation — flips the radio via the registry so the
  // dashboard row version bumps and every other tab (via storage
  // events) re-reads.
  // -----------------------------------------------------------------------
  const handleShareLevelChange = async (next: string): Promise<void> => {
    // The radio value is typed loosely by HeroUI — narrow it back.
    const nextLevel = next as DashboardShareLevel;

    if (nextLevel === shareLevel) return;

    // Optimistic UI flip so the extra "role-restricted" section
    // renders immediately without waiting for the round-trip.
    setShareLevel(nextLevel);

    try {
      await registry.update(dashboard.id, {
        version: dashboard.version,
        shareLevel: nextLevel,
      });
      toast.success("Access updated", {
        description:
          nextLevel === "private"
            ? "Only you can see this dashboard in-app."
            : nextLevel === "shared"
              ? "Every tenant member can see this dashboard in-app."
              : "Restricted to the roles and people you've granted.",
      });
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Could not update access.";

      // Roll the local mirror back so the radio matches the persisted
      // state; the storage layer rejects stale writes rather than
      // silently applying half a change.
      setShareLevel(dashboard.shareLevel);
      toast.danger("Update failed", { description: message });
    }
  };

  // -----------------------------------------------------------------------
  // Grant mutations — add / remove tied to the composite Select
  // key so the picker's identity round-trips cleanly.
  // -----------------------------------------------------------------------

  const handleAddGrant = async (): Promise<void> => {
    if (!pendingGrantKey) return;

    const option = OPTION_BY_KEY.get(pendingGrantKey);

    if (!option) return;

    try {
      await registry.addShareGrant(dashboard.id, {
        targetType: option.targetType,
        targetId: option.targetId,
        targetLabel: option.targetLabel,
      });
      setPendingGrantKey(null);
      await reloadGrants();
      toast.success("Access granted", { description: option.targetLabel });
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Could not add grant.";

      toast.danger("Grant failed", { description: message });
    }
  };

  const handleRemoveGrant = async (grant: DashboardShareGrant): Promise<void> => {
    try {
      await registry.removeShareGrant(grant.id);
      await reloadGrants();
      toast("Access revoked", { description: grant.targetLabel });
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Could not revoke.";

      toast.danger("Revoke failed", { description: message });
    }
  };

  // -----------------------------------------------------------------------
  // Embed-token mutations (existing flow — untouched contract-wise).
  // -----------------------------------------------------------------------

  /** Translate the refresh-cadence choice into a millisecond value. */
  const refreshMsFromChoice = (choice: typeof refreshChoice): number | undefined =>
    refreshMsFromChoiceLiteral(choice);

  const handleIssue = async (): Promise<void> => {
    try {
      // Parse the textarea-driven allowlists at submit time. `parseList`
      // splits on both newlines and commas so a pasted CIDR block or
      // referer list works verbatim.
      const ipAllowlist = parseList(ipAllowlistText);
      const refererAllowlist = parseList(refererAllowlistText);
      const viewerEmailAllowlist = parseList(viewerEmailAllowlistText).map((entry) =>
        entry.toLowerCase(),
      );
      const viewerDomainAllowlist = parseList(viewerDomainAllowlistText).map((entry) =>
        entry.toLowerCase(),
      );
      const maxUsesRaw = maxUsesText.trim();
      const maxUsesParsed = maxUsesRaw ? Number.parseInt(maxUsesRaw, 10) : NaN;
      const maxUses =
        Number.isFinite(maxUsesParsed) && maxUsesParsed > 0 ? maxUsesParsed : undefined;

      const whitelabelLogo = whitelabelLogoUrl.trim();
      const whitelabelAcc = whitelabelAccent.trim();
      const whitelabelWelcome = whitelabelWelcomeText.trim();
      const whitelabel =
        whitelabelLogo || whitelabelAcc || whitelabelWelcome
          ? {
              logoUrl: whitelabelLogo || undefined,
              accent: whitelabelAcc || undefined,
              welcomeText: whitelabelWelcome || undefined,
            }
          : undefined;

      const issued = await registry.issueEmbedToken(dashboard.id, {
        label: label.trim() || undefined,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
        kind: broadcastKind,
        password: broadcastPassword.trim() || undefined,
        refreshMs: refreshMsFromChoice(refreshChoice),
        rotationSeconds: broadcastKind === "present" ? rotationSeconds : undefined,
        // Phase-2 access controls — `undefined` skips the guard.
        ipAllowlist: ipAllowlist.length > 0 ? ipAllowlist : undefined,
        refererAllowlist: refererAllowlist.length > 0 ? refererAllowlist : undefined,
        viewerEmailAllowlist: viewerEmailAllowlist.length > 0 ? viewerEmailAllowlist : undefined,
        viewerDomainAllowlist: viewerDomainAllowlist.length > 0 ? viewerDomainAllowlist : undefined,
        maxUses,
        // Phase-3 data protection
        watermark: watermarkEnabled
          ? { enabled: true, text: watermarkText.trim() || undefined }
          : undefined,
        disableCopy: disableCopy ? true : undefined,
        piiMask: piiMask ? true : undefined,
        dataWindowFrom: dataWindowFrom.trim() || undefined,
        dataWindowTo: dataWindowTo.trim() || undefined,
        // Phase-4 whitelabel
        whitelabel,
      });

      setJustIssued(issued);
      setLabel("");
      setExpiresAt("");
      setBroadcastPassword("");
      setRefreshChoice("off");
      setRotationSeconds(30);
      setIpAllowlistText("");
      setRefererAllowlistText("");
      setViewerEmailAllowlistText("");
      setViewerDomainAllowlistText("");
      setMaxUsesText("");
      setWatermarkEnabled(false);
      setWatermarkText("{brand}·{date}");
      setDisableCopy(false);
      setPiiMask(false);
      setDataWindowFrom("");
      setDataWindowTo("");
      setWhitelabelLogoUrl("");
      setWhitelabelAccent("");
      setWhitelabelWelcomeText("");
      await reloadTokens();
      toast.success("Share link created", {
        description: "Copy the link before dismissing — it's shown once.",
      });
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Could not create link.";

      toast.danger("Share failed", { description: message });
    }
  };

  const handleRevokeToken = async (token: EmbedTokenRecord): Promise<void> => {
    try {
      await registry.revokeEmbedToken(dashboard.id, token.id);
      await reloadTokens();
      toast("Share link revoked", { description: token.label ?? "Anonymous link" });
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Could not revoke.";

      toast.danger("Revoke failed", { description: message });
    }
  };

  const copyEmbed = async (url: string): Promise<void> => {
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      toast.warning("Clipboard unavailable in this browser.");

      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied", { description: url });
    } catch {
      toast.danger("Copy failed", { description: "Copy the link manually." });
    }
  };

  // -----------------------------------------------------------------------
  // Phase-7 template picker — apply / save. Applying a template
  // spreads its `config` across every form field the base form
  // owns; downstream fields keep their local edits so the operator
  // can tweak the applied preset before hitting "Create link".
  // -----------------------------------------------------------------------

  const handleApplyTemplate = (template: BroadcastTemplate | null): void => {
    setAppliedTemplate(template);

    if (!template) return;

    const config = template.config;

    if (config.label !== undefined) setLabel(config.label);
    if (config.expiresAt !== undefined) {
      // ISO-8601 → `YYYY-MM-DDTHH:mm` for the datetime-local field.
      // Slice the seconds + zone so the native picker accepts it.
      const localish =
        config.expiresAt.length >= 16 ? config.expiresAt.slice(0, 16) : config.expiresAt;

      setExpiresAt(localish);
    }
    if (config.kind !== undefined) setBroadcastKind(config.kind);
    setRefreshChoice(refreshChoiceFromMs(config.refreshMs));
    if (config.rotationSeconds !== undefined) setRotationSeconds(config.rotationSeconds);
    // `password` intentionally omitted — templates never persist the
    // raw string; the operator must retype the password if they want
    // the gate applied on the new link.
    if (config.ipAllowlist !== undefined) setIpAllowlistText(config.ipAllowlist.join("\n"));
    if (config.refererAllowlist !== undefined) {
      setRefererAllowlistText(config.refererAllowlist.join("\n"));
    }
    if (config.viewerEmailAllowlist !== undefined) {
      setViewerEmailAllowlistText(config.viewerEmailAllowlist.join("\n"));
    }
    if (config.viewerDomainAllowlist !== undefined) {
      setViewerDomainAllowlistText(config.viewerDomainAllowlist.join("\n"));
    }
    if (config.maxUses !== undefined) setMaxUsesText(String(config.maxUses));
    if (config.watermark !== undefined) {
      setWatermarkEnabled(config.watermark.enabled);
      if (config.watermark.text !== undefined) setWatermarkText(config.watermark.text);
    }
    if (config.disableCopy !== undefined) setDisableCopy(config.disableCopy);
    if (config.piiMask !== undefined) setPiiMask(config.piiMask);
    if (config.dataWindowFrom !== undefined) setDataWindowFrom(config.dataWindowFrom);
    if (config.dataWindowTo !== undefined) setDataWindowTo(config.dataWindowTo);
    if (config.whitelabel !== undefined) {
      setWhitelabelLogoUrl(config.whitelabel.logoUrl ?? "");
      setWhitelabelAccent(config.whitelabel.accent ?? "");
      setWhitelabelWelcomeText(config.whitelabel.welcomeText ?? "");
    }
  };

  /**
   * Snapshot the current form state into a template config payload.
   * Mirrors the sanitiser used in `handleIssue` so the persisted
   * config matches what would ship on the wire if the operator
   * clicked "Create link" instead of "Save as template".
   */
  const snapshotFormAsConfig = (): Partial<IssueEmbedTokenInput> => {
    const ipAllowlist = parseList(ipAllowlistText);
    const refererAllowlist = parseList(refererAllowlistText);
    const viewerEmailAllowlist = parseList(viewerEmailAllowlistText).map((entry) =>
      entry.toLowerCase(),
    );
    const viewerDomainAllowlist = parseList(viewerDomainAllowlistText).map((entry) =>
      entry.toLowerCase(),
    );
    const maxUsesRaw = maxUsesText.trim();
    const maxUsesParsed = maxUsesRaw ? Number.parseInt(maxUsesRaw, 10) : NaN;
    const maxUses = Number.isFinite(maxUsesParsed) && maxUsesParsed > 0 ? maxUsesParsed : undefined;

    const whitelabelLogo = whitelabelLogoUrl.trim();
    const whitelabelAcc = whitelabelAccent.trim();
    const whitelabelWelcome = whitelabelWelcomeText.trim();
    const whitelabel =
      whitelabelLogo || whitelabelAcc || whitelabelWelcome
        ? {
            logoUrl: whitelabelLogo || undefined,
            accent: whitelabelAcc || undefined,
            welcomeText: whitelabelWelcome || undefined,
          }
        : undefined;

    return {
      label: label.trim() || undefined,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      kind: broadcastKind,
      // Password intentionally omitted — templates never carry the
      // raw password. The persisted config is designed to be read
      // straight back into the form; a leaked template must not
      // leak a password.
      refreshMs: refreshMsFromChoice(refreshChoice),
      rotationSeconds: broadcastKind === "present" ? rotationSeconds : undefined,
      ipAllowlist: ipAllowlist.length > 0 ? ipAllowlist : undefined,
      refererAllowlist: refererAllowlist.length > 0 ? refererAllowlist : undefined,
      viewerEmailAllowlist: viewerEmailAllowlist.length > 0 ? viewerEmailAllowlist : undefined,
      viewerDomainAllowlist: viewerDomainAllowlist.length > 0 ? viewerDomainAllowlist : undefined,
      maxUses,
      watermark: watermarkEnabled
        ? { enabled: true, text: watermarkText.trim() || undefined }
        : undefined,
      disableCopy: disableCopy ? true : undefined,
      piiMask: piiMask ? true : undefined,
      dataWindowFrom: dataWindowFrom.trim() || undefined,
      dataWindowTo: dataWindowTo.trim() || undefined,
      whitelabel,
    };
  };

  const handleSaveTemplate = async (): Promise<void> => {
    const trimmed = templateNameInput.trim();

    if (!trimmed) {
      toast.warning("Template name is required.");

      return;
    }

    try {
      const template = await registry.createBroadcastTemplate({
        name: trimmed,
        description: templateDescriptionInput.trim() || undefined,
        icon: templateIconInput,
        isShared: templateIsSharedInput,
        config: snapshotFormAsConfig(),
      });

      setSaveTemplateOpen(false);
      setTemplateNameInput("");
      setTemplateDescriptionInput("");
      setTemplateIconInput(undefined);
      setTemplateIsSharedInput(false);
      // Applying the just-saved template lights the "From:" chip so
      // the operator has visual confirmation the snapshot landed.
      setAppliedTemplate(template);
      toast.success("Template saved", { description: template.name });
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Could not save template.";

      toast.danger("Save failed", { description: message });
    }
  };

  const handleDeleteTemplate = async (template: BroadcastTemplate): Promise<void> => {
    try {
      await registry.deleteBroadcastTemplate(template.id);
      // If the deleted template was the currently applied one, clear
      // the chip so the operator doesn't see a stale label.
      if (appliedTemplate?.id === template.id) {
        setAppliedTemplate(null);
      }
      toast("Template deleted", { description: template.name });
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Could not delete template.";

      toast.danger("Delete failed", { description: message });
    }
  };

  // -----------------------------------------------------------------------
  // Phase-7 rotation — mint a fresh URL and mark the source with a
  // grace window. On success the modal keeps rendering the new URL
  // in a copy-once panel so the operator can grab it before closing.
  // -----------------------------------------------------------------------

  const handleConfirmRotate = async (): Promise<void> => {
    if (!rotateTarget) return;

    try {
      const issued = await registry.rotateEmbedToken(
        dashboard.id,
        rotateTarget.id,
        rotateGraceSeconds,
      );

      setRotateIssued(issued);
      // Refresh the list so the source row picks up the grace
      // window badge and the new row shows up.
      await reloadTokens();
      toast.success("Link rotated", {
        description: "Copy the new link before dismissing — it's shown once.",
      });
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Could not rotate link.";

      toast.danger("Rotation failed", { description: message });
    }
  };

  const closeRotateModal = (): void => {
    setRotateTarget(null);
    setRotateIssued(null);
    setRotateGraceSeconds(86_400);
  };

  // -----------------------------------------------------------------------
  // Phase-6 audit log — lazy-load per token. `activeAuditTokenId`
  // drives which token's events are rendered; toggling to a new
  // token in the same session triggers a fresh fetch only when the
  // adapter hasn't cached the result already.
  // -----------------------------------------------------------------------

  const handleDownloadAuditCsv = async (tokenId: string): Promise<void> => {
    // The endpoint requires the current dashboard's user-scoped id;
    // playground has no server, so we build a synthetic CSV client-
    // side from the in-memory rows. Production callers land on the
    // real `view-log.csv` route via the same button.
    if (typeof window === "undefined") return;

    const rows = auditLogByToken[tokenId] ?? [];

    if (rows.length === 0) {
      // Kick a load and let the caller retry; the button stays
      // rendered so the operator can click again once the fetch
      // completes.
      await loadAuditLog(tokenId);
      toast("No activity yet", { description: "Try again after the first viewer opens the link." });

      return;
    }

    const header = [
      "occurred_at",
      "event_type",
      "event_type_label",
      "viewer_ip_hash",
      "viewer_ua_hash",
      "country_code",
      "viewer_email",
      "denial_reason",
      "denial_reason_label",
    ];
    const escape = (value: string | undefined): string => {
      if (!value) return "";
      const needsQuoting = /[",\n]/.test(value);

      return needsQuoting ? `"${value.replaceAll('"', '""')}"` : value;
    };
    const body = rows
      .map((row) =>
        [
          row.occurredAt,
          row.eventType,
          row.eventTypeLabel,
          row.viewerIpHash,
          row.viewerUaHash,
          row.countryCode,
          row.viewerEmail,
          row.denialReason,
          row.denialReasonLabel,
        ]
          .map(escape)
          .join(","),
      )
      .join("\n");
    const csv = `${header.join(",")}\n${body}\n`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `broadcast-view-log-${tokenId}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const handleTokenMenuAction = (token: EmbedTokenRecord, key: Key): void => {
    switch (key) {
      case "copy":
        // The raw token is only revealed once at issue time; we
        // don't hold it in the list. Nudge the operator to rotate
        // if they need a fresh URL.
        toast("Raw URL not available", {
          description: "The link was shown once at issue. Use Rotate to mint a fresh URL.",
        });
        break;
      case "rotate":
        setRotateTarget(token);
        setRotateGraceSeconds(86_400);
        setRotateIssued(null);
        break;
      case "revoke":
        void handleRevokeToken(token);
        break;
      case "activity":
        setActiveAuditTokenId(token.id);
        break;
      default:
        break;
    }
  };

  return (
    <>
      <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-lg">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Icon className="bg-accent-soft text-accent-soft-foreground">
                <Iconify className="size-4" icon="share" />
              </Modal.Icon>
              <Modal.Heading>Share {dashboard.name}</Modal.Heading>
              <p className="mt-1.5 text-sm leading-5 text-muted">
                Control who sees this dashboard in-app, and separately issue public read-only links
                for viewers without an account.
              </p>
            </Modal.Header>
            <Modal.Body>
              <div className="flex flex-col gap-6">
                {/* ---------------------------------------------------------
                  Section 1 — Who can see this dashboard (in-app access)
                  --------------------------------------------------------- */}
                <section className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <Label className="text-sm font-medium text-foreground">
                      Who can see this dashboard
                    </Label>
                    <p className="text-xs leading-5 text-muted">
                      Restricted dashboards only appear in the tenant sidebar for people you&apos;ve
                      granted access to. Embed links (below) bypass this rule and are publicly
                      reachable.
                    </p>
                  </div>

                  <RadioGroup
                    isDisabled={registry.isMutating || dashboard.isBuiltIn}
                    onChange={handleShareLevelChange}
                    value={shareLevel}
                    variant="secondary"
                  >
                    <Radio value="private">
                      <Radio.Content>
                        <Radio.Control>
                          <Radio.Indicator />
                        </Radio.Control>
                        Private
                      </Radio.Content>
                      <Description>Only you can see this dashboard in-app.</Description>
                    </Radio>
                    <Radio value="shared">
                      <Radio.Content>
                        <Radio.Control>
                          <Radio.Indicator />
                        </Radio.Control>
                        Shared with tenant
                      </Radio.Content>
                      <Description>
                        Every authenticated tenant member sees this dashboard.
                      </Description>
                    </Radio>
                    <Radio value="role-restricted">
                      <Radio.Content>
                        <Radio.Control>
                          <Radio.Indicator />
                        </Radio.Control>
                        Role-restricted
                      </Radio.Content>
                      <Description>
                        Only the roles and people you grant below can see this dashboard.
                      </Description>
                    </Radio>
                  </RadioGroup>

                  {isRestricted ? (
                    <RoleRestrictedGrantsEditor
                      grantedKeys={grantedKeys}
                      grants={grants}
                      isLoading={isLoadingGrants}
                      isMutating={registry.isMutating}
                      onAdd={handleAddGrant}
                      onRemove={handleRemoveGrant}
                      onSelectionChange={setPendingGrantKey}
                      pendingKey={pendingGrantKey}
                    />
                  ) : null}
                </section>

                <Separator />

                {/* ---------------------------------------------------------
                  Section 2 — Public embed links
                  --------------------------------------------------------- */}
                <section className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <Label className="text-sm font-medium text-foreground">
                      Public embed links
                    </Label>
                    <p className="text-xs leading-5 text-muted">
                      Anyone with an embed link can view this dashboard read-only, without signing
                      in. Links can be revoked at any time.
                    </p>
                  </div>
                  {!canShare ? (
                    <div className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm text-warning-soft-foreground">
                      <Iconify className="mt-0.5 size-4" icon="triangle-exclamation" />
                      <div>
                        <p className="font-medium">Embed links require public visibility.</p>
                        <p className="text-xs">
                          Enable <strong>Shared with tenant</strong> in Settings (via the Customise
                          panel) before issuing links.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {justIssued ? (
                        <div className="flex flex-col gap-2 rounded-lg border border-accent/40 bg-accent/5 p-3">
                          <div className="flex items-center gap-2">
                            <Iconify className="size-4 text-accent" icon="link" />
                            <Label className="text-sm font-medium text-foreground">
                              New link — copy now
                            </Label>
                            <Chip className="ms-auto" size="sm" variant="soft">
                              <Chip.Label>Shown once</Chip.Label>
                            </Chip>
                          </div>
                          <div className="flex items-center gap-2">
                            <code className="min-w-0 flex-1 truncate rounded-md bg-surface-secondary px-2 py-1.5 text-xs text-foreground">
                              {justIssued.embedUrl}
                            </code>
                            <Button
                              onPress={() => copyEmbed(justIssued.embedUrl)}
                              size="sm"
                              variant="primary"
                            >
                              <Iconify className="size-4" icon="copy" />
                              Copy
                            </Button>
                          </div>
                        </div>
                      ) : null}

                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-2">
                          <Label className="text-sm font-medium text-foreground">
                            Create a new share link
                          </Label>
                          {canBulkManage ? (
                            <Button
                              onPress={() => setBulkRevokeOpen(true)}
                              size="sm"
                              variant="ghost"
                            >
                              <Iconify className="size-3.5" icon="triangle-exclamation" />
                              Bulk actions
                            </Button>
                          ) : null}
                        </div>

                        {/* Phase-7 template picker — a preset combination
                          of delivery + access + branding fields the
                          operator can spread across the form. Rendered
                          at the top of the create form so it feels
                          like a starting point rather than a footer. */}
                        <TemplatePickerRow
                          applied={appliedTemplate}
                          onApply={handleApplyTemplate}
                          onDelete={handleDeleteTemplate}
                          templates={registry.broadcastTemplates}
                        />

                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <TextField onChange={setLabel} value={label}>
                            <Label>Label</Label>
                            <Input placeholder="Investor deck" variant="secondary" />
                          </TextField>
                          <TextField onChange={setExpiresAt} value={expiresAt}>
                            <Label>Expires (optional)</Label>
                            <Input
                              placeholder="YYYY-MM-DDTHH:MM"
                              type="datetime-local"
                              variant="secondary"
                            />
                          </TextField>
                        </div>

                        {/* -----------------------------------------------
                          Section A — Delivery. The always-visible base
                          of the create form: broadcast kind, refresh
                          cadence, rotation seconds, password.
                          ----------------------------------------------- */}
                        <div className="mt-1 flex flex-col gap-3 rounded-lg border border-border/60 bg-surface-secondary/30 p-3">
                          <div className="flex flex-col gap-1.5">
                            <Label className="text-xs font-medium tracking-wide text-foreground uppercase">
                              Broadcast type
                            </Label>
                            <div className="flex gap-1.5">
                              <Button
                                onPress={() => setBroadcastKind("embed")}
                                size="sm"
                                variant={broadcastKind === "embed" ? "primary" : "secondary"}
                              >
                                <Iconify className="size-3.5" icon="frame" />
                                Embed
                              </Button>
                              <Button
                                onPress={() => setBroadcastKind("present")}
                                size="sm"
                                variant={broadcastKind === "present" ? "primary" : "secondary"}
                              >
                                <Iconify className="size-3.5" icon="tv" />
                                Present
                              </Button>
                            </div>
                            <p className="text-xs leading-4 text-muted">
                              {broadcastKind === "embed"
                                ? "One dashboard, rendered chromeless. Good for iframes and single-page shares."
                                : "Kiosk slideshow that cycles through this dashboard. Ideal for TV walls."}
                            </p>
                          </div>

                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <div className="flex flex-col gap-1.5">
                              <Label className="text-xs font-medium text-foreground">
                                Auto-refresh
                              </Label>
                              <select
                                className="bg-field-background rounded-md border border-border px-2 py-1.5 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                                onChange={(event) =>
                                  setRefreshChoice(event.target.value as typeof refreshChoice)
                                }
                                value={refreshChoice}
                              >
                                <option value="off">Off — viewer must reload</option>
                                <option value="10s">Every 10 seconds</option>
                                <option value="30s">Every 30 seconds</option>
                                <option value="1m">Every 1 minute</option>
                                <option value="5m">Every 5 minutes</option>
                                <option value="15m">Every 15 minutes</option>
                                <option value="1h">Every 1 hour</option>
                              </select>
                            </div>

                            {broadcastKind === "present" ? (
                              <div className="flex flex-col gap-1.5">
                                <Label className="text-xs font-medium text-foreground">
                                  Slide duration
                                </Label>
                                <select
                                  className="bg-field-background rounded-md border border-border px-2 py-1.5 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                                  onChange={(event) =>
                                    setRotationSeconds(Number(event.target.value))
                                  }
                                  value={String(rotationSeconds)}
                                >
                                  <option value="10">10 seconds</option>
                                  <option value="20">20 seconds</option>
                                  <option value="30">30 seconds</option>
                                  <option value="60">1 minute</option>
                                  <option value="120">2 minutes</option>
                                  <option value="300">5 minutes</option>
                                </select>
                              </div>
                            ) : null}
                          </div>

                          <TextField onChange={setBroadcastPassword} value={broadcastPassword}>
                            <Label>Password (optional)</Label>
                            <Input
                              placeholder="Leave blank for no gate"
                              type="password"
                              variant="secondary"
                            />
                          </TextField>
                          <p className="-mt-1 text-[11px] leading-4 text-muted">
                            When set, viewers see a lock screen before the dashboard resolves.
                            Hashed server-side — the raw password is never persisted.
                          </p>
                        </div>

                        {/* -----------------------------------------------
                          Sections B/C/D — Access, Protection, Branding.
                          Rendered as a stack of collapsibles so the
                          dialog stays scannable when the operator only
                          needs the base fields. Everything below is
                          optional; a bare "Create link" still mints a
                          plain chromeless embed.
                          ----------------------------------------------- */}
                        <DisclosureGroup className="flex flex-col gap-2">
                          <Disclosure id="broadcast-access">
                            <Disclosure.Heading>
                              <Button
                                className="w-full justify-between rounded-lg border border-border/60 bg-surface-secondary/30 px-3 py-2 text-left"
                                variant="ghost"
                              >
                                <span className="flex items-center gap-2">
                                  <Iconify className="size-4 opacity-70" icon="lock" />
                                  <span className="text-sm font-medium text-foreground">
                                    Access
                                  </span>
                                  <span className="text-[11px] text-muted">
                                    IP · Referer · Viewer · Max uses
                                  </span>
                                </span>
                                <Disclosure.Indicator className="text-muted" />
                              </Button>
                            </Disclosure.Heading>
                            <Disclosure.Content>
                              <Disclosure.Body className="-mt-1 rounded-b-lg border-x border-b border-border/60 px-3 py-3">
                                <div className="flex flex-col gap-3">
                                  <TextField onChange={setIpAllowlistText} value={ipAllowlistText}>
                                    <Label>IP allowlist</Label>
                                    <TextArea
                                      className="min-h-[72px] font-mono text-xs"
                                      placeholder={"10.0.0.0/8\n192.168.1.0/24\n2001:db8::/32"}
                                      variant="secondary"
                                    />
                                    <Description>
                                      One CIDR range per line. Leave empty to allow every IP.
                                    </Description>
                                  </TextField>

                                  <TextField
                                    onChange={setRefererAllowlistText}
                                    value={refererAllowlistText}
                                  >
                                    <Label>Referer allowlist</Label>
                                    <TextArea
                                      className="min-h-[72px] font-mono text-xs"
                                      placeholder={
                                        "https://partner.example.com/\nhttps://intra.corp/"
                                      }
                                      variant="secondary"
                                    />
                                    <Description>
                                      URL prefix per line. Only requests whose Referer header starts
                                      with one of these are served.
                                    </Description>
                                  </TextField>

                                  <TextField
                                    onChange={setViewerEmailAllowlistText}
                                    value={viewerEmailAllowlistText}
                                  >
                                    <Label>Viewer email allowlist</Label>
                                    <TextArea
                                      className="min-h-[72px] font-mono text-xs"
                                      placeholder={"alice@example.com\nbob@partner.example.com"}
                                      variant="secondary"
                                    />
                                    <Description>
                                      One email per line. Used by the future magic-link viewer flow.
                                    </Description>
                                  </TextField>

                                  <TextField
                                    onChange={setViewerDomainAllowlistText}
                                    value={viewerDomainAllowlistText}
                                  >
                                    <Label>Viewer domain allowlist</Label>
                                    <TextArea
                                      className="min-h-[64px] font-mono text-xs"
                                      placeholder={"example.com\npartner.example.com"}
                                      variant="secondary"
                                    />
                                    <Description>
                                      One domain per line. Suffix match — grants every subdomain.
                                    </Description>
                                  </TextField>

                                  <TextField onChange={setMaxUsesText} value={maxUsesText}>
                                    <Label>Max uses</Label>
                                    <Input
                                      inputMode="numeric"
                                      placeholder="Unlimited"
                                      type="number"
                                      variant="secondary"
                                    />
                                    <Description>
                                      Empty or 0 means unlimited. Set to 1 for a one-shot investor
                                      deck link.
                                    </Description>
                                  </TextField>
                                </div>
                              </Disclosure.Body>
                            </Disclosure.Content>
                          </Disclosure>

                          <Disclosure id="broadcast-protection">
                            <Disclosure.Heading>
                              <Button
                                className="w-full justify-between rounded-lg border border-border/60 bg-surface-secondary/30 px-3 py-2 text-left"
                                variant="ghost"
                              >
                                <span className="flex items-center gap-2">
                                  <Iconify className="size-4 opacity-70" icon="shield" />
                                  <span className="text-sm font-medium text-foreground">
                                    Protection
                                  </span>
                                  <span className="text-[11px] text-muted">
                                    Watermark · Anti-copy · PII · Data window
                                  </span>
                                </span>
                                <Disclosure.Indicator className="text-muted" />
                              </Button>
                            </Disclosure.Heading>
                            <Disclosure.Content>
                              <Disclosure.Body className="-mt-1 rounded-b-lg border-x border-b border-border/60 px-3 py-3">
                                <div className="flex flex-col gap-3">
                                  <ProtectionSwitchRow
                                    description="Diagonal watermark overlaid on the viewer surface. Use {brand} and {date} tokens."
                                    isSelected={watermarkEnabled}
                                    label="Watermark"
                                    onChange={setWatermarkEnabled}
                                  />
                                  {watermarkEnabled ? (
                                    <TextField onChange={setWatermarkText} value={watermarkText}>
                                      <Label className="sr-only">Watermark text</Label>
                                      <Input placeholder="{brand}·{date}" variant="secondary" />
                                      <Description>
                                        Rendered at low opacity, tiled across the surface.
                                      </Description>
                                    </TextField>
                                  ) : null}

                                  <ProtectionSwitchRow
                                    description="Disables the right-click menu, drag gestures, and text selection. Best-effort — browsers can't fully prevent screenshots."
                                    isSelected={disableCopy}
                                    label="Disable copy & screenshot"
                                    onChange={setDisableCopy}
                                  />

                                  <ProtectionSwitchRow
                                    description="Blurs viewer names and emails opted into the pii-name / pii-email classes."
                                    isSelected={piiMask}
                                    label="Mask PII (names, emails)"
                                    onChange={setPiiMask}
                                  />

                                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                    <TextField onChange={setDataWindowFrom} value={dataWindowFrom}>
                                      <Label>Data window — from</Label>
                                      <Input
                                        placeholder="YYYY-MM-DD"
                                        type="date"
                                        variant="secondary"
                                      />
                                    </TextField>
                                    <TextField onChange={setDataWindowTo} value={dataWindowTo}>
                                      <Label>Data window — to</Label>
                                      <Input
                                        placeholder="YYYY-MM-DD"
                                        type="date"
                                        variant="secondary"
                                      />
                                    </TextField>
                                  </div>
                                  <p className="-mt-1 text-[11px] leading-4 text-muted">
                                    Widgets that opt into date filtering intersect the window with
                                    their own configured range.
                                  </p>
                                </div>
                              </Disclosure.Body>
                            </Disclosure.Content>
                          </Disclosure>

                          <Disclosure id="broadcast-branding">
                            <Disclosure.Heading>
                              <Button
                                className="w-full justify-between rounded-lg border border-border/60 bg-surface-secondary/30 px-3 py-2 text-left"
                                variant="ghost"
                              >
                                <span className="flex items-center gap-2">
                                  <Iconify className="size-4 opacity-70" icon="brush" />
                                  <span className="text-sm font-medium text-foreground">
                                    Branding
                                  </span>
                                  <span className="text-[11px] text-muted">
                                    Logo · Accent · Welcome text
                                  </span>
                                </span>
                                <Disclosure.Indicator className="text-muted" />
                              </Button>
                            </Disclosure.Heading>
                            <Disclosure.Content>
                              <Disclosure.Body className="-mt-1 rounded-b-lg border-x border-b border-border/60 px-3 py-3">
                                <div className="flex flex-col gap-3">
                                  <TextField
                                    onChange={setWhitelabelLogoUrl}
                                    value={whitelabelLogoUrl}
                                  >
                                    <Label>Logo URL</Label>
                                    <Input
                                      placeholder="https://cdn.example.com/logo.svg"
                                      type="url"
                                      variant="secondary"
                                    />
                                    <Description>
                                      Replaces the Academorix isotipo in the viewer header.
                                    </Description>
                                  </TextField>

                                  <div className="flex items-end gap-2">
                                    <TextField
                                      className="flex-1"
                                      onChange={setWhitelabelAccent}
                                      value={whitelabelAccent}
                                    >
                                      <Label>Accent color</Label>
                                      <Input placeholder="#ff8800" variant="secondary" />
                                      <Description>
                                        Any CSS color. Applied as the viewer&apos;s
                                        <code className="mx-1">--accent</code> token.
                                      </Description>
                                    </TextField>
                                    <span
                                      aria-hidden
                                      className="mb-6 inline-block size-8 flex-none rounded-md border border-border"
                                      style={{
                                        backgroundColor: whitelabelAccent.trim() || undefined,
                                      }}
                                    />
                                  </div>

                                  <TextField
                                    onChange={setWhitelabelWelcomeText}
                                    value={whitelabelWelcomeText}
                                  >
                                    <Label>Welcome text</Label>
                                    <Input placeholder="Q3 Board Review" variant="secondary" />
                                    <Description>
                                      Replaces the header brand chip when set.
                                    </Description>
                                  </TextField>
                                </div>
                              </Disclosure.Body>
                            </Disclosure.Content>
                          </Disclosure>
                        </DisclosureGroup>

                        <div className="flex justify-end gap-2">
                          <Button
                            isDisabled={registry.isMutating}
                            onPress={() => setSaveTemplateOpen(true)}
                            size="sm"
                            variant="ghost"
                          >
                            <Iconify className="size-4" icon="star" />
                            Save as template
                          </Button>
                          <Button
                            isDisabled={registry.isMutating}
                            isPending={registry.isMutating}
                            onPress={handleIssue}
                            size="sm"
                            variant="secondary"
                          >
                            <Iconify className="size-4" icon="plus" />
                            Create link
                          </Button>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Label className="text-sm font-medium text-foreground">
                          Existing links
                        </Label>
                        {isLoadingTokens ? (
                          <p className="text-xs text-muted">Loading…</p>
                        ) : tokens.length === 0 ? (
                          <p className="text-xs text-muted">No links yet.</p>
                        ) : (
                          <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
                            {[...tokens]
                              .slice()
                              .sort((a, b) => {
                                const rankDiff = tokenRowRank(a) - tokenRowRank(b);

                                if (rankDiff !== 0) return rankDiff;

                                return b.createdAt.localeCompare(a.createdAt);
                              })
                              .map((token) => {
                                const revoked = Boolean(token.revokedAt);
                                const superseded = Boolean(token.supersededByTokenId) && !revoked;

                                return (
                                  <li key={token.id} className="flex items-start gap-3 px-3 py-2.5">
                                    <div className="min-w-0 flex-1">
                                      <p className="text-sm font-medium text-foreground">
                                        {token.label ?? "Anonymous link"}
                                      </p>
                                      <p className="text-xs text-muted">
                                        Created {new Date(token.createdAt).toLocaleString()}
                                        {token.expiresAt
                                          ? ` · expires ${new Date(token.expiresAt).toLocaleString()}`
                                          : ""}
                                        {typeof token.useCount === "number"
                                          ? ` · ${token.useCount} views`
                                          : ""}
                                      </p>
                                      {superseded && token.graceExpiresAt ? (
                                        <p className="text-[11px] leading-4 text-warning-soft-foreground">
                                          Rotated — grace ends{" "}
                                          {new Date(token.graceExpiresAt).toLocaleString()}
                                        </p>
                                      ) : null}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      {revoked ? (
                                        <Chip size="sm" variant="soft">
                                          <Chip.Label>Revoked</Chip.Label>
                                        </Chip>
                                      ) : superseded ? (
                                        <Chip color="warning" size="sm" variant="soft">
                                          <Chip.Label>Rotated</Chip.Label>
                                        </Chip>
                                      ) : null}
                                      <Dropdown>
                                        <Button
                                          aria-label={`Actions for ${token.label ?? "link"}`}
                                          className="text-muted hover:text-foreground"
                                          isIconOnly
                                          size="sm"
                                          variant="ghost"
                                        >
                                          <Iconify className="size-3.5" icon="ellipsis" />
                                        </Button>
                                        <Dropdown.Popover placement="bottom end">
                                          <Dropdown.Menu
                                            onAction={(key) => handleTokenMenuAction(token, key)}
                                          >
                                            <Dropdown.Item id="copy">
                                              <Iconify className="size-4 shrink-0" icon="copy" />
                                              <Label>Copy link</Label>
                                            </Dropdown.Item>
                                            <Dropdown.Item id="activity">
                                              <Iconify className="size-4 shrink-0" icon="clock" />
                                              <Label>View activity</Label>
                                            </Dropdown.Item>
                                            <Dropdown.Item id="rotate" isDisabled={revoked}>
                                              <Iconify className="size-4 shrink-0" icon="rocket" />
                                              <Label>Rotate</Label>
                                            </Dropdown.Item>
                                            <Dropdown.Item
                                              id="revoke"
                                              isDisabled={revoked}
                                              variant="danger"
                                            >
                                              <Iconify className="size-4 shrink-0" icon="xmark" />
                                              <Label>Revoke</Label>
                                            </Dropdown.Item>
                                          </Dropdown.Menu>
                                        </Dropdown.Popover>
                                      </Dropdown>
                                    </div>
                                  </li>
                                );
                              })}
                          </ul>
                        )}

                        {/* Phase-6 audit-log surface — collapsible under
                          the "Existing links" list so it stays hidden
                          until the operator asks for it. Selecting a
                          token from a row menu opens this section on
                          the same token. */}
                        <ActivitySection
                          activeTokenId={activeAuditTokenId}
                          isLoading={isLoadingAuditLog}
                          onDownloadCsv={handleDownloadAuditCsv}
                          onSelectToken={setActiveAuditTokenId}
                          rows={
                            activeAuditTokenId ? (auditLogByToken[activeAuditTokenId] ?? []) : []
                          }
                          tokens={tokens}
                        />
                      </div>
                    </div>
                  )}
                </section>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button
                className="w-full"
                onPress={() => onOpenChange(false)}
                size="sm"
                variant="primary"
              >
                Done
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>

      {/* Phase-7 — nested "Save as template" modal. Owns its own
          Backdrop so it renders above the main dialog when open. */}
      <SaveTemplateModal
        description={templateDescriptionInput}
        icon={templateIconInput}
        isMutating={registry.isMutating}
        isOpen={isSaveTemplateOpen}
        isShared={templateIsSharedInput}
        name={templateNameInput}
        onDescriptionChange={setTemplateDescriptionInput}
        onIconChange={setTemplateIconInput}
        onIsSharedChange={setTemplateIsSharedInput}
        onNameChange={setTemplateNameInput}
        onOpenChange={(open) => setSaveTemplateOpen(open)}
        onSubmit={handleSaveTemplate}
      />

      {/* Phase-7 — nested "Rotate link" modal. Rendered whenever the
          per-token menu has selected a token; closing the modal
          clears the selection. */}
      <RotateTokenModal
        graceSeconds={rotateGraceSeconds}
        isMutating={registry.isMutating}
        issued={rotateIssued}
        onConfirm={handleConfirmRotate}
        onCopy={copyEmbed}
        onGraceChange={setRotateGraceSeconds}
        onOpenChange={(open) => {
          if (!open) closeRotateModal();
        }}
        target={rotateTarget}
      />

      {/* Phase-7 — nested "Bulk revoke" modal. Only rendered when the
          caller has `dashboards.manage`; the trigger button itself
          is already guarded on the same permission. */}
      {canBulkManage ? (
        <BulkRevokeModal
          currentDashboardId={dashboard.id}
          dashboards={registry.dashboards}
          isMutating={registry.isMutating}
          isOpen={isBulkRevokeOpen}
          onOpenChange={(open) => setBulkRevokeOpen(open)}
          onPreview={registry.previewBulkRevoke}
          onSubmit={async (filters) => {
            const result = await registry.bulkRevokeEmbedTokens(filters);

            await reloadTokens();

            return result;
          }}
        />
      ) : null}
    </>
  );
}

/**
 * Grants editor rendered underneath the radio group when the
 * user picks "Role-restricted". Handles:
 *
 *   * Listing already-granted targets with an inline revoke `×`.
 *   * Autocomplete-style picker (grouped Select) for adding a new
 *     grant — Everyone / Roles / People sections; already-granted
 *     targets are omitted from the picker to avoid duplicate
 *     submissions.
 *   * "Grant access" action button that lands the pending selection.
 */
interface RoleRestrictedGrantsEditorProps {
  grants: readonly DashboardShareGrant[];
  grantedKeys: ReadonlySet<SelectOptionKey>;
  isLoading: boolean;
  isMutating: boolean;
  pendingKey: SelectOptionKey | null;
  onAdd: () => void;
  onRemove: (grant: DashboardShareGrant) => void;
  onSelectionChange: (next: SelectOptionKey | null) => void;
}

function RoleRestrictedGrantsEditor({
  grants,
  grantedKeys,
  isLoading,
  isMutating,
  pendingKey,
  onAdd,
  onRemove,
  onSelectionChange,
}: RoleRestrictedGrantsEditorProps): ReactNode {
  const availableRoles = ROLE_OPTIONS.filter((option) => !grantedKeys.has(option.key));
  const availableUsers = USER_OPTIONS.filter((option) => !grantedKeys.has(option.key));
  const everyoneAvailable = !grantedKeys.has(EVERYONE_OPTION.key);

  const hasAvailable = everyoneAvailable || availableRoles.length > 0 || availableUsers.length > 0;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface-secondary/40 p-3">
      <div className="flex flex-col gap-2">
        <Label className="text-xs font-medium tracking-wide text-foreground uppercase">
          Granted access ({grants.length})
        </Label>
        {isLoading ? (
          <p className="text-xs text-muted">Loading…</p>
        ) : grants.length === 0 ? (
          <p className="text-xs text-muted">
            No one else has access yet — grant a role or person below.
          </p>
        ) : (
          <ul className="flex flex-wrap gap-1.5">
            {grants.map((grant) => (
              <li key={grant.id}>
                <Chip size="sm" variant="soft">
                  <Chip.Label>
                    <span className="flex items-center gap-1.5">
                      <Iconify
                        aria-hidden
                        className="size-3 opacity-70"
                        icon={
                          grant.targetType === "user"
                            ? "person"
                            : grant.targetType === "role"
                              ? "persons"
                              : "globe"
                        }
                      />
                      <span>{grant.targetLabel}</span>
                      <button
                        aria-label={`Revoke access for ${grant.targetLabel}`}
                        className="ms-0.5 inline-flex size-3.5 items-center justify-center rounded-full text-muted transition-colors hover:text-danger"
                        onClick={() => onRemove(grant)}
                        type="button"
                      >
                        <Iconify className="size-3" icon="xmark" />
                      </button>
                    </span>
                  </Chip.Label>
                </Chip>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-2">
        <Select
          className="min-w-0 flex-1"
          isDisabled={isMutating || !hasAvailable}
          onChange={(value: Key | Key[] | null) => {
            // The Select is single-select — narrow to the scalar
            // case so the composite-key type check stays exact.
            if (typeof value === "string") {
              onSelectionChange(value as SelectOptionKey);
            } else {
              onSelectionChange(null);
            }
          }}
          placeholder={
            hasAvailable ? "Add a role or person…" : "Everyone available is already granted"
          }
          value={pendingKey}
          variant="secondary"
        >
          <Label className="sr-only">Grant access to</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {everyoneAvailable ? (
                <ListBox.Item
                  key={EVERYONE_OPTION.key}
                  id={EVERYONE_OPTION.key}
                  textValue={EVERYONE_OPTION.targetLabel}
                >
                  <Iconify className="size-4 opacity-70" icon="globe" />
                  <div className="flex flex-col">
                    <Label>{EVERYONE_OPTION.targetLabel}</Label>
                    <Description>Open access to every tenant member.</Description>
                  </div>
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ) : null}
              {availableRoles.map((option) => {
                // Role slug label reads best in singular form; the
                // targetLabel is already the plural noun so we
                // don't massage it further.
                return (
                  <ListBox.Item key={option.key} id={option.key} textValue={option.targetLabel}>
                    <Iconify className="size-4 opacity-70" icon="persons" />
                    <div className="flex flex-col">
                      <Label>{option.targetLabel}</Label>
                      <Description>Role · {option.targetId}</Description>
                    </div>
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                );
              })}
              {availableUsers.map((option) => {
                // Look up the extra email metadata from the same
                // hard-coded list so the picker feels like a real
                // people finder rather than a bare id dropdown.
                const user = PLAYGROUND_USERS.find((entry) => entry.id === option.targetId);

                return (
                  <ListBox.Item key={option.key} id={option.key} textValue={option.targetLabel}>
                    <Iconify className="size-4 opacity-70" icon="person" />
                    <div className="flex flex-col">
                      <Label>{option.targetLabel}</Label>
                      {user ? <Description>{user.email}</Description> : null}
                    </div>
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                );
              })}
            </ListBox>
          </Select.Popover>
        </Select>
        <Button
          isDisabled={!pendingKey || isMutating}
          isPending={isMutating}
          onPress={onAdd}
          size="sm"
          variant="secondary"
        >
          <Iconify className="size-4" icon="plus" />
          Grant access
        </Button>
      </div>
    </div>
  );
}
/**
 * Single-line row used inside the Protection collapsible. Renders a
 * label + description on the left and a HeroUI `Switch` on the right,
 * mirroring the visual language of the `SwitchRow` in the customise
 * panel (@see modules/dashboard/components/customize-panel).
 *
 * Kept local to the share dialog because the surrounding controls
 * (dependent watermark text field, PII opt-in copy) are share-
 * specific — hoisting the row into a shared component would drag
 * every consumer into supporting share-only affordances.
 */
interface ProtectionSwitchRowProps {
  label: string;
  description: string;
  isSelected: boolean;
  onChange: (next: boolean) => void;
}

function ProtectionSwitchRow({
  label,
  description,
  isSelected,
  onChange,
}: ProtectionSwitchRowProps): ReactNode {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-xs leading-4 text-muted">{description}</span>
      </div>
      <Switch aria-label={label} isSelected={isSelected} onChange={onChange}>
        <Switch.Content>
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
        </Switch.Content>
      </Switch>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Phase-7 template picker row — a Select over the registry's template
// snapshot plus a soft chip showing the "applied" template. Rendered
// at the top of the "Create link" form so the picker feels like a
// starting point rather than a footer control.
// ---------------------------------------------------------------------------

interface TemplatePickerRowProps {
  templates: readonly BroadcastTemplate[];
  applied: BroadcastTemplate | null;
  onApply: (template: BroadcastTemplate | null) => void;
  onDelete: (template: BroadcastTemplate) => Promise<void>;
}

function TemplatePickerRow({
  templates,
  applied,
  onApply,
  onDelete,
}: TemplatePickerRowProps): ReactNode {
  const byId = useMemo(() => {
    const map = new Map<string, BroadcastTemplate>();

    for (const template of templates) map.set(template.id, template);

    return map;
  }, [templates]);

  const handleChange = (value: Key | Key[] | null): void => {
    if (typeof value !== "string") {
      onApply(null);

      return;
    }

    const template = byId.get(value);

    onApply(template ?? null);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs font-medium tracking-wide text-foreground uppercase">
        Start from template
      </Label>
      <div className="flex flex-wrap items-center gap-2">
        <Select
          className="min-w-0 flex-1"
          isDisabled={templates.length === 0}
          onChange={handleChange}
          placeholder={
            templates.length === 0 ? "No templates yet — save one below" : "Pick a saved template…"
          }
          value={applied?.id ?? null}
          variant="secondary"
        >
          <Label className="sr-only">Template</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {templates.map((template) => (
                <ListBox.Item key={template.id} id={template.id} textValue={template.name}>
                  <Iconify className="size-4 opacity-70" icon={template.icon ?? "layers"} />
                  <div className="flex flex-col">
                    <Label>{template.name}</Label>
                    {template.description ? (
                      <Description>{template.description}</Description>
                    ) : (
                      <Description>
                        {template.isShared ? "Shared" : "Private"} · used {template.useCount} times
                      </Description>
                    )}
                  </div>
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
        {applied ? (
          <Chip color="accent" size="sm" variant="soft">
            <Chip.Label>
              <span className="flex items-center gap-1.5">
                <Iconify aria-hidden className="size-3" icon={applied.icon ?? "layers"} />
                <span>From: {applied.name}</span>
                <button
                  aria-label={`Clear applied template ${applied.name}`}
                  className="ms-0.5 inline-flex size-3.5 items-center justify-center rounded-full text-muted transition-colors hover:text-danger"
                  onClick={() => onApply(null)}
                  type="button"
                >
                  <Iconify className="size-3" icon="xmark" />
                </button>
              </span>
            </Chip.Label>
          </Chip>
        ) : null}
        {applied ? (
          <Tooltip>
            <Button
              aria-label={`Delete template ${applied.name}`}
              isIconOnly
              onPress={() => onDelete(applied)}
              size="sm"
              variant="ghost"
            >
              <Iconify className="size-3.5" icon="xmark" />
            </Button>
            <Tooltip.Content>Delete this template</Tooltip.Content>
          </Tooltip>
        ) : null}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Phase-6 activity section — collapsible under the "Existing links"
// list. Renders the audit-log rows for the currently-selected token
// with per-event icon + colour + relative timestamp. A "Download CSV"
// button next to the section header lets the operator export the
// raw rows for offline analysis.
// ---------------------------------------------------------------------------

interface ActivitySectionProps {
  tokens: readonly EmbedTokenRecord[];
  activeTokenId: string | null;
  rows: readonly BroadcastViewLogRecord[];
  isLoading: boolean;
  onSelectToken: (id: string | null) => void;
  onDownloadCsv: (tokenId: string) => Promise<void>;
}

const EVENT_ICON: Record<BroadcastViewLogRecord["eventType"], string> = {
  unlock_success: "shield-check",
  unlock_failure: "triangle-exclamation",
  resolve_success: "eye",
  resolve_denied: "xmark",
  revoked: "xmark",
};

const EVENT_TONE: Record<BroadcastViewLogRecord["eventType"], string> = {
  unlock_success: "text-success",
  unlock_failure: "text-danger",
  resolve_success: "text-success",
  resolve_denied: "text-danger",
  revoked: "text-warning",
};

/** Render a "5m ago" / "2h ago" style relative caption from an ISO timestamp. */
function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diffSec = Math.max(0, Math.round((Date.now() - then) / 1000));

  if (diffSec < 45) return "just now";
  if (diffSec < 3600) return `${Math.round(diffSec / 60)} min ago`;
  if (diffSec < 86_400) return `${Math.round(diffSec / 3600)} h ago`;
  if (diffSec < 604_800) return `${Math.round(diffSec / 86_400)} d ago`;

  return new Date(iso).toLocaleDateString();
}

function ActivitySection({
  tokens,
  activeTokenId,
  rows,
  isLoading,
  onSelectToken,
  onDownloadCsv,
}: ActivitySectionProps): ReactNode {
  // Suggest the newest live token as the default when the operator
  // opens the section without picking a specific row from the menu.
  const defaultTokenId = useMemo(() => {
    const live = tokens.filter((token) => !token.revokedAt);

    if (live.length === 0) return null;

    return live.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]?.id ?? null;
  }, [tokens]);

  return (
    <DisclosureGroup className="mt-2 flex flex-col gap-2">
      <Disclosure id="broadcast-activity">
        <Disclosure.Heading>
          <Button
            className="w-full justify-between rounded-lg border border-border/60 bg-surface-secondary/30 px-3 py-2 text-left"
            variant="ghost"
          >
            <span className="flex items-center gap-2">
              <Iconify className="size-4 opacity-70" icon="clock" />
              <span className="text-sm font-medium text-foreground">Activity</span>
              <span className="text-[11px] text-muted">Views · unlock attempts · denials</span>
            </span>
            <Disclosure.Indicator className="text-muted" />
          </Button>
        </Disclosure.Heading>
        <Disclosure.Content>
          <Disclosure.Body className="-mt-1 rounded-b-lg border-x border-b border-border/60 px-3 py-3">
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-end gap-2">
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <Label className="text-xs font-medium text-foreground">For link</Label>
                  <select
                    className="bg-field-background rounded-md border border-border px-2 py-1.5 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                    onChange={(event) => onSelectToken(event.target.value || null)}
                    value={activeTokenId ?? defaultTokenId ?? ""}
                  >
                    <option value="">— Pick a link —</option>
                    {tokens.map((token) => (
                      <option key={token.id} value={token.id}>
                        {token.label ?? "Anonymous link"} · created{" "}
                        {new Date(token.createdAt).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  isDisabled={!activeTokenId}
                  onPress={() => activeTokenId && onDownloadCsv(activeTokenId)}
                  size="sm"
                  variant="ghost"
                >
                  <Iconify className="size-3.5" icon="chart-line" />
                  Download CSV
                </Button>
              </div>

              {isLoading ? (
                <p className="text-xs text-muted">Loading activity…</p>
              ) : !activeTokenId ? (
                <p className="text-xs text-muted">Pick a link to see its audit trail.</p>
              ) : rows.length === 0 ? (
                <p className="text-xs text-muted">No activity yet.</p>
              ) : (
                <ul className="max-h-64 divide-y divide-border overflow-y-auto rounded-md border border-border">
                  {rows.map((row) => (
                    <li key={row.id} className="flex items-start gap-2.5 px-3 py-2">
                      <Iconify
                        aria-hidden
                        className={`mt-0.5 size-4 shrink-0 ${EVENT_TONE[row.eventType]}`}
                        icon={EVENT_ICON[row.eventType]}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm leading-4 font-medium text-foreground">
                          {row.eventTypeLabel}
                          {row.denialReasonLabel ? (
                            <span className="ms-1.5 text-xs font-normal text-muted">
                              · {row.denialReasonLabel}
                            </span>
                          ) : null}
                        </p>
                        <p className="text-[11px] text-muted">
                          {relativeTime(row.occurredAt)}
                          {row.viewerEmail ? ` · ${row.viewerEmail}` : ""}
                          {row.countryCode ? ` · ${row.countryCode}` : ""}
                        </p>
                      </div>
                      {row.viewerIpHash ? (
                        <Tooltip>
                          <code className="rounded bg-surface-secondary px-1.5 py-0.5 font-mono text-[10px] text-muted">
                            {row.viewerIpHash.slice(0, 8)}
                          </code>
                          <Tooltip.Content>
                            <span className="font-mono text-[10px]">{row.viewerIpHash}</span>
                          </Tooltip.Content>
                        </Tooltip>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Disclosure.Body>
        </Disclosure.Content>
      </Disclosure>
    </DisclosureGroup>
  );
}

// ---------------------------------------------------------------------------
// Phase-7 "Save as template" modal — takes a snapshot of the current
// form state (already captured on submit by the parent) plus a
// descriptive payload (name / description / icon / shared flag).
// ---------------------------------------------------------------------------

interface SaveTemplateModalProps {
  isOpen: boolean;
  isMutating: boolean;
  name: string;
  description: string;
  icon: string | undefined;
  isShared: boolean;
  onNameChange: (next: string) => void;
  onDescriptionChange: (next: string) => void;
  onIconChange: (next: string | undefined) => void;
  onIsSharedChange: (next: boolean) => void;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => Promise<void>;
}

function SaveTemplateModal({
  isOpen,
  isMutating,
  name,
  description,
  icon,
  isShared,
  onNameChange,
  onDescriptionChange,
  onIconChange,
  onIsSharedChange,
  onOpenChange,
  onSubmit,
}: SaveTemplateModalProps): ReactNode {
  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Container placement="center">
        <Modal.Dialog className="sm:max-w-md">
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Icon className="bg-accent-soft text-accent-soft-foreground">
              <Iconify className="size-4" icon="star" />
            </Modal.Icon>
            <Modal.Heading>Save as template</Modal.Heading>
            <p className="mt-1.5 text-sm leading-5 text-muted">
              Snapshot the current form settings so you can reuse them on future links.
            </p>
          </Modal.Header>
          <Modal.Body>
            <div className="flex flex-col gap-3">
              <TextField isRequired onChange={onNameChange} value={name}>
                <Label>Name</Label>
                <Input placeholder="Investor deck (locked)" variant="secondary" />
                <Description>Shown in the template picker.</Description>
              </TextField>

              <TextField onChange={onDescriptionChange} value={description}>
                <Label>Description</Label>
                <TextArea
                  className="min-h-[72px]"
                  placeholder="Locked, watermarked, IP-restricted."
                  variant="secondary"
                />
              </TextField>

              <div className="flex flex-col gap-1.5">
                <Label className="text-sm font-medium text-foreground">Icon</Label>
                <div className="flex flex-wrap gap-1.5">
                  {TEMPLATE_ICON_CHOICES.map((choice) => {
                    const active = icon === choice;

                    return (
                      <button
                        key={choice}
                        aria-pressed={active}
                        className={[
                          "flex size-8 items-center justify-center rounded-lg border transition-colors",
                          active
                            ? "border-accent bg-accent/10 text-accent"
                            : "border-border text-muted hover:border-foreground/40 hover:text-foreground",
                        ].join(" ")}
                        onClick={() => onIconChange(active ? undefined : choice)}
                        type="button"
                      >
                        <Iconify className="size-4" icon={choice} />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-sm font-medium text-foreground">Share with tenant</span>
                  <span className="text-xs leading-4 text-muted">
                    Teammates can pick this template from their share dialog.
                  </span>
                </div>
                <Switch
                  aria-label="Share with tenant"
                  isSelected={isShared}
                  onChange={onIsSharedChange}
                >
                  <Switch.Content>
                    <Switch.Control>
                      <Switch.Thumb />
                    </Switch.Control>
                  </Switch.Content>
                </Switch>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button onPress={() => onOpenChange(false)} size="sm" variant="ghost">
              Cancel
            </Button>
            <Button
              isDisabled={isMutating || !name.trim()}
              isPending={isMutating}
              onPress={() => void onSubmit()}
              size="sm"
              variant="primary"
            >
              <Iconify className="size-4" icon="star" />
              Save template
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

// ---------------------------------------------------------------------------
// Phase-7 rotation modal — warns about grace-window behaviour, lets
// the operator pick a duration, and once the rotation lands renders
// a copy-once panel with the new URL so it can be grabbed before
// dismiss.
// ---------------------------------------------------------------------------

interface RotateTokenModalProps {
  target: EmbedTokenRecord | null;
  graceSeconds: number;
  issued: IssuedEmbedToken | null;
  isMutating: boolean;
  onGraceChange: (next: number) => void;
  onConfirm: () => Promise<void>;
  onCopy: (url: string) => Promise<void>;
  onOpenChange: (open: boolean) => void;
}

function RotateTokenModal({
  target,
  graceSeconds,
  issued,
  isMutating,
  onGraceChange,
  onConfirm,
  onCopy,
  onOpenChange,
}: RotateTokenModalProps): ReactNode {
  return (
    <Modal.Backdrop isOpen={target !== null} onOpenChange={onOpenChange}>
      <Modal.Container placement="center">
        <Modal.Dialog className="sm:max-w-md">
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Icon className="bg-warning/10 text-warning-soft-foreground">
              <Iconify className="size-4" icon="rocket" />
            </Modal.Icon>
            <Modal.Heading>Rotate link</Modal.Heading>
            <p className="mt-1.5 text-sm leading-5 text-muted">
              Rotating this link mints a new URL. The current link will keep working for a grace
              period before expiring.
            </p>
          </Modal.Header>
          <Modal.Body>
            <div className="flex flex-col gap-3">
              {target ? (
                <div className="flex flex-col gap-1 rounded-lg border border-border bg-surface-secondary/40 p-3 text-xs">
                  <p className="text-sm font-medium text-foreground">
                    {target.label ?? "Anonymous link"}
                  </p>
                  <p className="text-muted">
                    Created {new Date(target.createdAt).toLocaleString()} · {target.useCount} views
                  </p>
                </div>
              ) : null}

              {issued ? (
                <div className="flex flex-col gap-2 rounded-lg border border-accent/40 bg-accent/5 p-3">
                  <div className="flex items-center gap-2">
                    <Iconify className="size-4 text-accent" icon="link" />
                    <Label className="text-sm font-medium text-foreground">
                      New link — copy now
                    </Label>
                    <Chip className="ms-auto" size="sm" variant="soft">
                      <Chip.Label>Shown once</Chip.Label>
                    </Chip>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="min-w-0 flex-1 truncate rounded-md bg-surface-secondary px-2 py-1.5 text-xs text-foreground">
                      {issued.embedUrl}
                    </code>
                    <Button
                      onPress={() => void onCopy(issued.embedUrl)}
                      size="sm"
                      variant="primary"
                    >
                      <Iconify className="size-4" icon="copy" />
                      Copy
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-medium text-foreground">Grace period</Label>
                  <select
                    className="bg-field-background rounded-md border border-border px-2 py-1.5 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                    onChange={(event) => onGraceChange(Number(event.target.value))}
                    value={String(graceSeconds)}
                  >
                    {ROTATION_GRACE_CHOICES.map((choice) => (
                      <option key={choice.value} value={choice.value}>
                        {choice.label}
                      </option>
                    ))}
                  </select>
                  <Description>
                    How long the old URL keeps resolving after the rotation.
                  </Description>
                </div>
              )}
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button onPress={() => onOpenChange(false)} size="sm" variant="ghost">
              {issued ? "Done" : "Cancel"}
            </Button>
            {!issued ? (
              <Button
                isDisabled={isMutating}
                isPending={isMutating}
                onPress={() => void onConfirm()}
                size="sm"
                variant="primary"
              >
                <Iconify className="size-4" icon="rocket" />
                Rotate link
              </Button>
            ) : null}
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

// ---------------------------------------------------------------------------
// Phase-7 bulk-revoke modal — four filter fields (owner, one
// dashboard, many dashboards, before-date) with a preview panel
// that updates every time the filters change. Validation guarantees
// at least one field is populated before submit.
// ---------------------------------------------------------------------------

interface BulkRevokeModalProps {
  isOpen: boolean;
  isMutating: boolean;
  dashboards: readonly Dashboard[];
  currentDashboardId: string;
  onOpenChange: (open: boolean) => void;
  onPreview: (filters: BulkRevokeFilters) => Promise<{ revoked: number }>;
  onSubmit: (filters: BulkRevokeFilters) => Promise<{ revoked: number }>;
}

function BulkRevokeModal({
  isOpen,
  isMutating,
  dashboards,
  currentDashboardId,
  onOpenChange,
  onPreview,
  onSubmit,
}: BulkRevokeModalProps): ReactNode {
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [dashboardId, setDashboardId] = useState<string | null>(null);
  const [dashboardIds, setDashboardIds] = useState<readonly string[]>([]);
  const [beforeDate, setBeforeDate] = useState("");
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Only shared dashboards can host embed tokens — filter the
  // picker source so the operator doesn't accidentally select a
  // private dashboard the resolver would ignore anyway.
  const shareableDashboards = useMemo(
    () => dashboards.filter((entry) => entry.visibility === "shared"),
    [dashboards],
  );

  // Reset transient state whenever the modal reopens so a second
  // pass starts fresh. The setState-in-effect pattern is intentional
  // here — the parent owns `isOpen`, we're the controlled child,
  // and there's no external-source signal to sync from.
  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOwnerId(null);
      setDashboardId(currentDashboardId ?? null);
      setDashboardIds([]);
      setBeforeDate("");
      setPreviewCount(null);
      setPreviewError(null);
    }
  }, [isOpen, currentDashboardId]);

  const filters: BulkRevokeFilters = useMemo(
    () => ({
      ownerId: ownerId ?? undefined,
      dashboardId: dashboardId ?? undefined,
      dashboardIds: dashboardIds.length > 0 ? dashboardIds : undefined,
      beforeDate: beforeDate ? new Date(beforeDate).toISOString() : undefined,
    }),
    [ownerId, dashboardId, dashboardIds, beforeDate],
  );

  const hasAnyFilter =
    Boolean(filters.ownerId) ||
    Boolean(filters.dashboardId) ||
    Boolean(filters.dashboardIds && filters.dashboardIds.length > 0) ||
    Boolean(filters.beforeDate);

  // Debounced preview — re-query whenever the filter set changes so
  // the count updates as the operator tweaks the form. The
  // setState-in-effect calls are intentional: the effect wires the
  // filter state to the async preview endpoint.
  useEffect(() => {
    if (!isOpen) return;
    if (!hasAnyFilter) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPreviewCount(null);
      setPreviewError(null);

      return;
    }

    let cancelled = false;

    void onPreview(filters)
      .then((result) => {
        if (!cancelled) {
          setPreviewCount(result.revoked);
          setPreviewError(null);
        }
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          const message = caught instanceof Error ? caught.message : "Preview unavailable.";

          setPreviewError(message);
          setPreviewCount(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [filters, hasAnyFilter, isOpen, onPreview]);

  const handleSubmit = async (): Promise<void> => {
    if (!hasAnyFilter) return;

    try {
      const result = await onSubmit(filters);

      toast.success("Bulk revoke complete", {
        description: `${result.revoked} broadcast${result.revoked === 1 ? "" : "s"} revoked.`,
      });
      onOpenChange(false);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Bulk revoke failed.";

      toast.danger("Revoke failed", { description: message });
    }
  };

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Container placement="center">
        <Modal.Dialog className="sm:max-w-lg">
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Icon className="bg-danger/10 text-danger">
              <Iconify className="size-4" icon="triangle-exclamation" />
            </Modal.Icon>
            <Modal.Heading>Bulk revoke broadcasts</Modal.Heading>
            <p className="mt-1.5 text-sm leading-5 text-muted">
              Combine any of the filters below to revoke every matching broadcast in one pass. At
              least one filter is required.
            </p>
          </Modal.Header>
          <Modal.Body>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium text-foreground">Owner</Label>
                <select
                  className="bg-field-background rounded-md border border-border px-2 py-1.5 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                  onChange={(event) => setOwnerId(event.target.value || null)}
                  value={ownerId ?? ""}
                >
                  <option value="">— Any owner —</option>
                  {PLAYGROUND_USERS.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.label} · {user.email}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium text-foreground">Dashboard</Label>
                <select
                  className="bg-field-background rounded-md border border-border px-2 py-1.5 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                  onChange={(event) => setDashboardId(event.target.value || null)}
                  value={dashboardId ?? ""}
                >
                  <option value="">— Any dashboard —</option>
                  {shareableDashboards.map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium text-foreground">Multiple dashboards</Label>
                <select
                  className="bg-field-background min-h-[100px] rounded-md border border-border px-2 py-1.5 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                  multiple
                  onChange={(event) => {
                    const next: string[] = [];

                    for (const option of event.target.options) {
                      if (option.selected) next.push(option.value);
                    }
                    setDashboardIds(next);
                  }}
                  value={dashboardIds as string[]}
                >
                  {shareableDashboards.map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.name}
                    </option>
                  ))}
                </select>
                <Description>
                  Hold Cmd/Ctrl to select multiple. Combined with the single dashboard filter above.
                </Description>
              </div>

              <TextField onChange={setBeforeDate} value={beforeDate}>
                <Label>Before date</Label>
                <Input placeholder="YYYY-MM-DDTHH:MM" type="datetime-local" variant="secondary" />
                <Description>
                  Revoke every matching link created strictly before this moment.
                </Description>
              </TextField>

              {!hasAnyFilter ? (
                <div className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3 text-xs text-warning-soft-foreground">
                  <Iconify className="mt-0.5 size-4" icon="triangle-exclamation" />
                  <span>Set at least one filter before submitting.</span>
                </div>
              ) : previewError ? (
                <div className="flex items-start gap-2 rounded-lg border border-danger/40 bg-danger/10 p-3 text-xs text-danger">
                  <Iconify className="mt-0.5 size-4" icon="triangle-exclamation" />
                  <span>{previewError}</span>
                </div>
              ) : (
                <div className="rounded-lg border border-border bg-surface-secondary/40 p-3 text-sm">
                  <p className="font-medium text-foreground">
                    This will affect approximately{" "}
                    <span className="text-accent">{previewCount ?? "…"}</span> broadcast
                    {previewCount === 1 ? "" : "s"}.
                  </p>
                </div>
              )}
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button onPress={() => onOpenChange(false)} size="sm" variant="ghost">
              Cancel
            </Button>
            <Button
              isDisabled={!hasAnyFilter || isMutating || previewCount === 0}
              isPending={isMutating}
              onPress={() => void handleSubmit()}
              size="sm"
              variant="danger"
            >
              <Iconify className="size-4" icon="xmark" />
              Revoke {previewCount ?? "?"} broadcast
              {previewCount === 1 ? "" : "s"}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
