/**
 * @file dashboard.tsx
 * @module modules/dashboard/pages/dashboard
 *
 * @description
 * The per-user dashboard page. Renders four regions:
 *
 *   1. **Header + Tabs** — the tab strip listing every dashboard, the
 *      Share button (visible whenever the current dashboard is
 *      shareable), and the Customise toggle.
 *   2. **Filter chip bar** — dashboard-wide date-range chips + scope
 *      overrides. Widgets that opt in read these; others ignore them.
 *   3. **Canvas** — the widget grid for the current dashboard.
 *   4. **Inspector** — the customise panel published into the shell's
 *      aside slot so the layout re-flows around it instead of
 *      overlaying (matches every page-builder we researched).
 *
 * Route contract:
 *
 *   * `/dashboard`        → user's default dashboard (fallback:
 *     `Overview`).
 *   * `/dashboard/{slug}` → the dashboard with that slug. Redirects
 *     to the default when the slug is unknown so a stale bookmark
 *     still lands somewhere.
 *
 * ## Keyboard shortcuts (§13.2 of the plan)
 *
 * The page installs page-scoped shortcuts:
 *
 *   * `⌘/Ctrl + E` — toggle edit (Customise) mode
 *   * `⌘/Ctrl + S` — save the current dashboard (no-op on built-ins)
 *   * `⌘/Ctrl + D` — duplicate the current dashboard
 *   * `⌘/Ctrl + Z` — undo (when editor is open)
 *   * `⌘/Ctrl + ⇧ + Z` — redo
 *   * `⌘/Ctrl + ⇧ + S` — open the share dialog
 */

import { Button, Chip, toast, Tooltip } from "@heroui/react";
import { useCallback, useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "@stackra/routing/react";

import type { Dashboard } from "@/modules/dashboard/dashboards";
import type { ReactNode } from "react";
import type { WidgetSize } from "@/modules/dashboard/sortable-widget";

import { Iconify } from "@/icons/iconify";
import { ShortcutKbd } from "@/lib/kbd";
import { useAsideSlot, useRegisterAsideContent } from "@/lib/aside-slot";
import { useAiAssistantSlot } from "@/hooks/use-ai-assistant-slot";
import {
  DEFAULT_DASHBOARD_ROUTE_SLUG,
  dashboardHref,
  dashboardStorage,
  useCurrentDashboard,
  useDashboardEditor,
  useDashboards,
} from "@/modules/dashboard/dashboards";
import { CustomizePanel } from "@/modules/dashboard/components/customize-panel";
import { DashboardCanvas } from "@/modules/dashboard/components/dashboard-canvas";
import { DashboardFilterBar } from "@/modules/dashboard/components/dashboard-filter-bar";
import { DashboardTabs } from "@/modules/dashboard/components/dashboard-tabs";
import { NewDashboardDialog } from "@/modules/dashboard/components/new-dashboard-dialog";
import { ShareDashboardDialog } from "@/modules/dashboard/components/share-dashboard-dialog";
import { WidgetCatalogueDrawer } from "@/modules/dashboard/components/widget-catalogue-drawer";

/**
 * Sentinel dashboard used before `current` resolves. Keeps
 * `useDashboardEditor` happy on first render while the registry
 * loads — the effect inside the editor swaps it out as soon as the
 * real dashboard arrives.
 */
const LOADING_DASHBOARD: Dashboard = {
  id: "__loading__",
  tenantId: "__loading__",
  ownerId: "__loading__",
  name: "Loading…",
  slug: "__loading__",
  visibility: "private",
  // Loading sentinel is never surfaced through any share path — the
  // field is here only to satisfy the required-field contract on
  // {@link Dashboard}.
  shareLevel: "private",
  isPinned: false,
  isDefault: false,
  isBuiltIn: true,
  layoutMode: "grid",
  layouts: { lg: [], md: [], sm: [] },
  widgets: [],
  version: 1,
  createdAt: new Date(0).toISOString(),
  updatedAt: new Date(0).toISOString(),
};

/** Wraps `window.confirm` so tests can stub it. */
function confirmAction(message: string): boolean {
  if (typeof window === "undefined") return true;

  return window.confirm(message);
}

/**
 * Detect the `⌘ + <key>` / `Ctrl + <key>` combo. Ignores modifier
 * events fired while the user is inside a text input.
 */
function isModifierKey(
  event: KeyboardEvent,
  key: string,
  { shift = false }: { shift?: boolean } = {},
): boolean {
  const target = event.target;

  if (target instanceof HTMLElement) {
    if (target.isContentEditable) return false;

    const tag = target.tagName;

    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return false;
  }

  if (!(event.metaKey || event.ctrlKey)) return false;
  if (event.shiftKey !== shift) return false;

  return event.key.toLowerCase() === key.toLowerCase();
}

export default function DashboardRoute(): ReactNode {
  const params = useParams<{ slug?: string }>();
  const navigate = useNavigate();
  const registry = useDashboards();
  const { current, dashboards, isLoading } = useCurrentDashboard(registry, params.slug);

  const asideSlot = useAsideSlot();
  const isEditing = asideSlot.isOpen;

  const [isNewOpen, setNewOpen] = useState(false);
  const [isShareOpen, setShareOpen] = useState(false);
  const [shareTarget, setShareTarget] = useState<Dashboard | null>(null);
  const [isCatalogueOpen, setCatalogueOpen] = useState(false);

  const editor = useDashboardEditor(
    current ?? LOADING_DASHBOARD,
    // WHY the memoised persist: `useDashboardEditor` uses this
    // callback as a dep of its internal `save`, and `save` feeds
    // the `useMemo` that produces the returned editor object.
    // If we passed a fresh arrow function every render the
    // editor's identity would flip on every render — which
    // cascades through `useAiAssistantSlot`'s effect →
    // `registerSlot` state update → provider re-render → this
    // component re-renders → new persist → new editor → infinite
    // loop. React 19's `Maximum update depth exceeded` catches
    // the overflow inside recharts' `ChartDataContextProvider`
    // (the first component that runs `setState` in an effect on
    // every render), so the stack trace pointed at charts even
    // though the source is the editor persist callback.
    //
    // `dashboardStorage` is a module-level singleton, so `update`
    // is a stable reference — an empty dep list is safe.
    useCallback((id, input) => dashboardStorage.update(id, input), []),
  );

  // WHY the slot registration lives here: the AI Assistant sheet
  // is mounted at the App level (see `AiAssistantProvider`) so
  // it's reachable from every page. The provider still needs the
  // current-page editor to talk to, though — we register it on
  // mount and let the hook tear the registration down when the
  // route unmounts. Passing `current` (not the sentinel) as the
  // gate stops the provider from wiring up a phantom editor on
  // the loading pass; `null` cleanly unregisters.
  useAiAssistantSlot(current ? editor : null, { isReadOnly: current?.isBuiltIn ?? false });

  const handleAsideClose = useCallback(() => asideSlot.setOpen(false), [asideSlot]);

  const handleDelete = useCallback(async (): Promise<void> => {
    if (!current) return;

    if (!confirmAction(`Delete "${current.name}"? This cannot be undone.`)) {
      return;
    }

    try {
      await registry.remove(current.id);
      toast.success("Dashboard deleted", { description: `${current.name} is gone.` });
      navigate("/dashboard", { replace: true });
      asideSlot.setOpen(false);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Could not delete.";

      toast.danger("Delete failed", { description: message });
    }
  }, [current, navigate, registry, asideSlot]);

  const openShare = useCallback((dashboard: Dashboard): void => {
    setShareTarget(dashboard);
    setShareOpen(true);
  }, []);

  /**
   * Bind the annotations add callback to the current dashboard's
   * id and the `registry.addAnnotation` mutator. Stabilised so
   * `<DashboardCanvas>` doesn't see a fresh reference every render
   * — that fed the loop that ended in `ChartDataContextProvider`
   * blowing past React 19's max-update-depth guard.
   */
  const handleAddAnnotation = useCallback(
    (widgetInstanceId: string, body: string) => {
      if (!current) {
        return Promise.reject(new Error("No dashboard is currently loaded."));
      }

      return registry.addAnnotation(current.id, widgetInstanceId, body);
    },
    [current, registry],
  );

  /**
   * Duplicate a widget by finding its source in the current draft
   * and appending a clone with a fresh id. Stabilised for the same
   * reference-identity reason as {@link handleAddAnnotation}.
   */
  const handleDuplicateWidget = useCallback(
    (widgetId: string) => {
      const source = editor.draft.widgets.find((entry) => entry.id === widgetId);

      if (!source) return;

      editor.setWidgets([
        ...editor.draft.widgets,
        {
          ...source,
          id: crypto.randomUUID(),
          title: source.title ? `${source.title} (copy)` : undefined,
        },
      ]);
      toast("Widget duplicated");
    },
    [editor],
  );

  /**
   * Persist a widget's size preset into its `config._size` slot.
   * Stabilised for the same reason as the other canvas callbacks.
   */
  const handleResizeWidget = useCallback(
    (widgetId: string, size: WidgetSize) => {
      const widget = editor.draft.widgets.find((entry) => entry.id === widgetId);

      editor.updateWidget(widgetId, {
        config: { ...(widget?.config ?? {}), _size: size },
      });
    },
    [editor],
  );

  const handleOpenCatalogue = useCallback(() => setCatalogueOpen(true), []);
  const handleOpenCustomise = useCallback(() => asideSlot.setOpen(true), [asideSlot]);

  // Publish the customise panel into the shell's aside slot via the
  // stable renderer pattern. The renderer closes over the latest
  // `editor` / `current` / `registry` values; the deps array below
  // tells the aside slot to re-notify subscribers when any of them
  // change so downstream state updates (draft edits, resource
  // navigation, annotation writes) propagate to the panel. Handler
  // callbacks are intentionally left out of the deps because they
  // close over the same values already listed — including them
  // would double-trigger without changing the rendered output.
  useRegisterAsideContent(
    current !== null,
    () => {
      if (!current) return null;

      return (
        <CustomizePanel
          editor={editor}
          onClose={handleAsideClose}
          onDelete={handleDelete}
          onDuplicate={() => duplicate(current)}
          onOpenCatalogue={() => setCatalogueOpen(true)}
          onOpenShare={() => openShare(current)}
          registry={registry}
          source={current}
        />
      );
    },
    [current, editor, registry],
  );

  const rename = useCallback(
    (dashboard: Dashboard): void => {
      const next = window.prompt("Rename dashboard", dashboard.name);

      if (!next || next === dashboard.name) return;

      void registry
        .update(dashboard.id, { version: dashboard.version, name: next })
        .then((updated) => {
          toast.success("Dashboard renamed", { description: updated.name });

          if (current && dashboard.id === current.id && updated.slug !== dashboard.slug) {
            navigate(dashboardHref(updated), { replace: true });
          }
        })
        .catch((caught: unknown) => {
          const message = caught instanceof Error ? caught.message : "Could not rename.";

          toast.danger("Rename failed", { description: message });
        });
    },
    [current, navigate, registry],
  );

  const duplicate = useCallback(
    async (dashboard: Dashboard): Promise<void> => {
      try {
        const copy = await registry.duplicate(dashboard.id);

        toast.success("Dashboard duplicated", { description: `Opening ${copy.name}.` });
        navigate(dashboardHref(copy));
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : "Could not duplicate.";

        toast.danger("Duplicate failed", { description: message });
      }
    },
    [navigate, registry],
  );

  const deleteFromTabs = useCallback(
    async (dashboard: Dashboard): Promise<void> => {
      if (!confirmAction(`Delete "${dashboard.name}"?`)) return;

      try {
        await registry.remove(dashboard.id);
        toast.success("Dashboard deleted", { description: `${dashboard.name} is gone.` });

        if (current && dashboard.id === current.id) {
          navigate("/dashboard", { replace: true });
        }
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : "Could not delete.";

        toast.danger("Delete failed", { description: message });
      }
    },
    [current, navigate, registry],
  );

  const togglePin = useCallback(
    async (dashboard: Dashboard): Promise<void> => {
      try {
        const updated = await registry.togglePin(dashboard.id, !dashboard.isPinned);

        toast(updated.isPinned ? "Pinned to sidebar" : "Unpinned from sidebar", {
          description: updated.name,
        });
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : "Could not update.";

        toast.danger("Update failed", { description: message });
      }
    },
    [registry],
  );

  const setDefault = useCallback(
    async (dashboard: Dashboard): Promise<void> => {
      try {
        const updated = await registry.setDefault(dashboard.id);

        toast.success("Default set", { description: `${updated.name} is now your default.` });
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : "Could not set default.";

        toast.danger("Update failed", { description: message });
      }
    },
    [registry],
  );

  const reorderWidgets = useCallback(
    (from: number, to: number): void => {
      const next = [...editor.draft.widgets];
      const [moved] = next.splice(from, 1);

      if (moved) next.splice(to, 0, moved);

      editor.setWidgets(next);
    },
    [editor],
  );

  // Page-scoped keyboard shortcuts. Registered once at mount and
  // torn down cleanly. Ignores keystrokes inside text inputs so
  // typing a name doesn't fire "duplicate dashboard".
  useEffect(() => {
    if (!current) return;

    const onKey = (event: KeyboardEvent): void => {
      if (isModifierKey(event, "e")) {
        event.preventDefault();
        asideSlot.toggle();

        return;
      }

      if (isModifierKey(event, "s") && !current.isBuiltIn) {
        event.preventDefault();

        if (editor.isDirty && !editor.isSaving) {
          void editor.save().then(
            () => toast.success("Dashboard saved", { description: current.name }),
            (caught: unknown) => {
              const message = caught instanceof Error ? caught.message : "Could not save.";

              toast.danger("Save failed", { description: message });
            },
          );
        }

        return;
      }

      if (
        isModifierKey(event, "s", { shift: true }) &&
        !current.isBuiltIn &&
        current.visibility === "shared"
      ) {
        event.preventDefault();
        openShare(current);

        return;
      }

      if (isModifierKey(event, "d")) {
        // Duplicate works for BOTH editable and built-in
        // dashboards — for built-ins it's the only path into an
        // editable copy, so blocking the shortcut there was a UX
        // trap. `duplicate()` navigates to the fresh copy on
        // success, so the current-source read-only state exits
        // automatically.
        event.preventDefault();
        void duplicate(current);

        return;
      }

      if (isModifierKey(event, "z") && asideSlot.isOpen) {
        event.preventDefault();
        editor.undo();

        return;
      }

      if (isModifierKey(event, "z", { shift: true }) && asideSlot.isOpen) {
        event.preventDefault();
        editor.redo();
      }
    };

    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, [asideSlot, current, duplicate, editor, openShare]);

  // Slug resolves to nothing (deleted / never existed) → redirect
  // to the default so a stale bookmark still lands somewhere.
  if (!isLoading && !current) {
    return <Navigate replace to="/dashboard" />;
  }

  if (!current) {
    return null;
  }

  const canShareLive = !current.isBuiltIn && current.visibility === "shared";
  const canFlipShare = !current.isBuiltIn;

  // The Present button is available whenever there's at least one
  // pinned dashboard to slideshow OR the current dashboard is
  // itself pinned. This matches the presenter route contract, which
  // falls back to every dashboard when nothing is pinned.
  const canPresent = current.isPinned || dashboards.some((entry) => entry.isPinned);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {current.name}
            </h1>
            {current.visibility === "shared" ? (
              <Tooltip>
                {/* WHY the aria-label on the Chip: Tooltip wraps a
                    non-focusable element (Chip has no button role),
                    and react-aria's `useTooltipTrigger` calls
                    `useLabel` which warns when neither the trigger
                    nor its content resolve to an accessible name.
                    Adding `aria-label` on the Chip gives the label
                    resolver a concrete string. */}
                <Chip aria-label="Shared dashboard" size="sm" variant="soft">
                  <Chip.Label>Shared</Chip.Label>
                </Chip>
                <Tooltip.Content>Visible to your tenant + embed links</Tooltip.Content>
              </Tooltip>
            ) : null}
            {current.isBuiltIn ? (
              <Tooltip>
                <Chip aria-label="Built-in dashboard" size="sm" variant="soft">
                  <Chip.Label>Built-in</Chip.Label>
                </Chip>
                <Tooltip.Content>Duplicate to make an editable copy.</Tooltip.Content>
              </Tooltip>
            ) : null}
          </div>
          <p className="text-sm text-muted">
            {current.isBuiltIn
              ? current.slug === "analytics"
                ? "Trends and drill-downs across every branch."
                : "An overview of your academy — rosters, revenue, and today's schedule."
              : `Your custom dashboard, updated ${new Date(current.updatedAt).toLocaleDateString()}.`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <DashboardTabs
              activeId={current.id}
              dashboards={dashboards}
              onCreate={() => setNewOpen(true)}
              onDelete={deleteFromTabs}
              onDuplicate={duplicate}
              onRename={rename}
              onSetDefault={setDefault}
              onShare={openShare}
              onTogglePin={togglePin}
            />
          </div>

          <div className="flex items-center gap-2">
            {canPresent ? (
              <Tooltip>
                <Button
                  aria-label="Enter presenter mode"
                  onPress={() => navigate("/dashboard/present")}
                  size="sm"
                  variant="secondary"
                >
                  <Iconify className="size-4" icon="play-fill" />
                  Present
                </Button>
                <Tooltip.Content>Full-screen slideshow of pinned dashboards</Tooltip.Content>
              </Tooltip>
            ) : null}
            {/*
             * WHY there's no Assistant button here anymore: the
             * assistant was promoted to a workspace-wide icon in
             * the navbar (see `app-navbar.tsx`) so operators can
             * reach it from any page. The sheet itself is
             * mounted by `AiAssistantProvider` and picks up the
             * editor via `useAiAssistantSlot` above.
             */}
            {canShareLive ? (
              <Tooltip>
                <Button onPress={() => openShare(current)} size="sm" variant="secondary">
                  <Iconify className="size-4" icon="share" />
                  Share
                </Button>
                <Tooltip.Content>
                  {/* WHY inline Kbd: sharing is a first-class shortcut
                      (⌘⇧S) — surfacing the binding inside the tooltip
                      keeps the button visually clean while advertising
                      the keystroke to power users. */}
                  <span className="flex items-center gap-1.5">
                    <span>Share a link to this dashboard</span>
                    <ShortcutKbd shortcut="Cmd+Shift+S" />
                  </span>
                </Tooltip.Content>
              </Tooltip>
            ) : canFlipShare ? (
              <Tooltip>
                <Button onPress={() => openShare(current)} size="sm" variant="ghost">
                  <Iconify className="size-4" icon="share" />
                  Share
                </Button>
                <Tooltip.Content>
                  Enable sharing in Settings to issue a public link.
                </Tooltip.Content>
              </Tooltip>
            ) : null}
            <Tooltip>
              <Button
                aria-pressed={isEditing}
                onPress={asideSlot.toggle}
                size="sm"
                variant={isEditing ? "primary" : "secondary"}
              >
                <Iconify className="size-4" icon="sliders" />
                {isEditing ? "Done editing" : "Customise"}
              </Button>
              <Tooltip.Content>
                {/* WHY the Kbd next to the tooltip copy: the Customise
                    toggle is bound to ⌘E page-scope, but users
                    routinely miss the binding because the button label
                    doesn't hint at it. Tooltip stays uncluttered
                    (single line, small chip) and advertises the
                    shortcut without spending button real estate. */}
                <span className="flex items-center gap-1.5">
                  <span>{isEditing ? "Exit customise mode" : "Customise this dashboard"}</span>
                  <ShortcutKbd shortcut="Cmd+E" />
                </span>
              </Tooltip.Content>
            </Tooltip>
          </div>
        </div>
      </header>

      <DashboardFilterBar editor={editor} isEditable={!current.isBuiltIn && isEditing} />

      {isEditing ? (
        <div className="flex items-center gap-2 rounded-xl border border-dashed border-accent/30 bg-accent/10 px-4 py-2 text-sm text-accent-foreground">
          <Iconify className="size-4" icon="sparkles" />
          <span>
            Editing this dashboard — drag widgets to reorder, add / remove in the panel, then hit{" "}
            <strong>Save</strong> (⌘S).
          </span>
        </div>
      ) : null}

      <DashboardCanvas
        annotations={registry.annotations}
        dashboard={editor.draft}
        dashboardId={current.id}
        editor={editor}
        isEditing={isEditing && !current.isBuiltIn}
        mode="editable"
        onAddAnnotation={handleAddAnnotation}
        onAddWidget={handleOpenCatalogue}
        onDuplicateWidget={handleDuplicateWidget}
        onRemoveAnnotation={registry.removeAnnotation}
        onRemoveWidget={editor.removeWidget}
        onReorderWidgets={reorderWidgets}
        onResizeWidget={handleResizeWidget}
        onUpdateAnnotation={registry.updateAnnotation}
      />

      {editor.draft.widgets.length === 0 && !isEditing ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center">
          <Iconify className="size-8 text-muted" icon="sliders" />
          <div>
            <p className="text-sm font-medium text-foreground">No widgets on this dashboard.</p>
            <p className="mt-1 text-xs text-muted">Open Customise to add some.</p>
          </div>
          <Button onPress={handleOpenCustomise} size="sm" variant="primary">
            <Iconify className="size-4" icon="sliders" />
            Customise
          </Button>
        </div>
      ) : null}

      <NewDashboardDialog
        isOpen={isNewOpen}
        onCreated={(dashboard) => navigate(dashboardHref(dashboard))}
        onOpenChange={setNewOpen}
        registry={registry}
      />

      <ShareDashboardDialog
        dashboard={shareTarget}
        isOpen={isShareOpen}
        onOpenChange={(open) => {
          setShareOpen(open);
          if (!open) setShareTarget(null);
        }}
        registry={registry}
      />

      <WidgetCatalogueDrawer
        editor={editor}
        isOpen={isCatalogueOpen}
        onOpenChange={setCatalogueOpen}
      />
    </div>
  );
}

/** Constant re-exported so the module manifest can build routes. */
export const DASHBOARD_DEFAULT_SLUG = DEFAULT_DASHBOARD_ROUTE_SLUG;
