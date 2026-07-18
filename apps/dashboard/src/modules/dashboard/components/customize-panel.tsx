/**
 * @file customize-panel.tsx
 * @module modules/dashboard/components/customize-panel
 *
 * @description
 * The inspector pane rendered into the shell's `AppLayout.aside` slot
 * when the user opens Customise on a dashboard. Replaces the earlier
 * `widget-picker.tsx` with a four-tab inspector modelled on Framer /
 * Notion / Figma:
 *
 *   * **Widgets** — reorder / remove / toggle-hide the widgets on
 *     the current dashboard, plus an `Add widget` button that opens
 *     the widget catalogue drawer.
 *   * **Layout** — grid mode (grid vs flow), column count reminders,
 *     reset-to-defaults.
 *   * **Settings** — name, icon, colour, visibility (private /
 *     shared), pin, default flag, delete.
 *   * **Filters** — dashboard-wide date range + scope overrides.
 *
 * The panel manages **draft state** in memory via
 * {@link useDashboardEditor}. Save + Discard sit at the bottom in a
 * sticky footer. Save persists through the storage adapter and
 * toasts on success/failure.
 *
 * Built-in dashboards (Overview / Analytics) render this panel in a
 * read-only mode with an inline banner explaining why editing is
 * disabled.
 */

import {
  Button,
  Chip,
  Input,
  Label,
  Separator,
  Switch,
  Tabs,
  TextField,
  toast,
  Tooltip,
} from "@heroui/react";
import { useCallback, useEffect, useState } from "react";

import type { ReactNode } from "react";

import type {
  CustomizePanelTab,
  Dashboard,
  DashboardVersionSnapshot,
  UseDashboardEditor,
  UseDashboardsResult,
} from "@/modules/dashboard/dashboards";
import type { WidgetInstance } from "@/modules/dashboard/dashboards";

import { Iconify } from "@/icons/iconify";
import { VersionHistoryDialog } from "@/modules/dashboard/components/version-history-dialog";
import { WidgetIllustration } from "@/modules/dashboard/components/widget-illustrations";
import { findWidget } from "@/modules/dashboard/widgets.catalogue";

/** Icon options for the settings picker — kept intentionally small. */
const ICON_CHOICES: readonly string[] = [
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

/** Colour tokens surfaced by the settings picker. */
const COLOR_CHOICES: readonly { id: string; label: string; className: string }[] = [
  { id: "accent", label: "Accent", className: "bg-accent" },
  { id: "success", label: "Success", className: "bg-success" },
  { id: "warning", label: "Warning", className: "bg-warning" },
  { id: "danger", label: "Danger", className: "bg-danger" },
  { id: "neutral", label: "Neutral", className: "bg-muted" },
];

export interface CustomizePanelProps {
  editor: UseDashboardEditor;
  /** The persisted source dashboard — used for "editable?" checks. */
  source: Dashboard;
  /**
   * Dashboard registry handle — needed by the History tab so it
   * can call `listVersions` / `restoreVersion` through the same
   * hook that manages the dashboard list refresh.
   */
  registry: UseDashboardsResult;
  /** Close the panel. */
  onClose: () => void;
  /** Open the widget catalogue drawer. */
  onOpenCatalogue: () => void;
  /** Open the share dialog. */
  onOpenShare: () => void;
  /** Delete the current dashboard (with confirm at call-site). */
  onDelete: () => Promise<void>;
  /**
   * Duplicate the source dashboard and navigate to the copy. Wired
   * to the "Duplicate to edit" affordance rendered in the panel
   * header when {@link source} is a built-in — the built-ins
   * themselves cannot be mutated, so the button offers the only
   * escape hatch from the read-only state without asking the user
   * to hunt through the tab-strip overflow menu.
   */
  onDuplicate: () => void | Promise<void>;
}

export function CustomizePanel({
  editor,
  source,
  registry,
  onClose,
  onOpenCatalogue,
  onOpenShare,
  onDelete,
  onDuplicate,
}: CustomizePanelProps): ReactNode {
  const [tab, setTab] = useState<CustomizePanelTab>("widgets");
  const [isHistoryOpen, setHistoryOpen] = useState(false);
  const isBuiltIn = source.isBuiltIn;

  const handleSave = async (): Promise<void> => {
    try {
      await editor.save();
      toast.success("Dashboard saved", {
        description: `${editor.draft.name} is up to date.`,
      });
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Could not save the dashboard.";

      toast.danger("Save failed", { description: message });
    }
  };

  const handleDiscard = (): void => {
    editor.discard();
    toast("Changes discarded", { description: "Reverted to the saved dashboard." });
  };

  return (
    <div aria-label="Customise dashboard" className="flex h-full min-h-0 flex-col" role="region">
      <header className="flex flex-col gap-2 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Iconify className="size-4 text-accent" icon="sliders" />
          <h2 className="text-sm font-semibold text-foreground">Customise dashboard</h2>
          {isBuiltIn ? (
            <Chip className="ms-auto" size="sm" variant="soft">
              <Chip.Label>Read-only</Chip.Label>
            </Chip>
          ) : editor.isDirty ? (
            <Chip className="ms-auto" size="sm" variant="soft">
              <Chip.Label>Unsaved changes</Chip.Label>
            </Chip>
          ) : null}
        </div>
        <p className="text-xs text-muted">
          {isBuiltIn
            ? "Built-in dashboards are curated by Academorix. Duplicate this dashboard to make a custom copy you can edit."
            : `Editing ${editor.draft.name} — changes stay in draft until you save.`}
        </p>
        {isBuiltIn ? (
          // Read-only escape hatch — the copy above already tells
          // the user to duplicate, but a visible primary button
          // removes the "hunt through the tab-strip overflow menu"
          // friction. Clicking navigates to the new copy so the
          // panel then re-renders in editable mode automatically.
          <Button className="mt-1" onPress={() => void onDuplicate()} size="sm" variant="primary">
            <Iconify className="size-4" icon="layers" />
            Duplicate to edit
          </Button>
        ) : null}
      </header>

      <Tabs
        className="border-b border-border"
        onSelectionChange={(key) => setTab(String(key) as CustomizePanelTab)}
        selectedKey={tab}
      >
        <Tabs.ListContainer>
          <Tabs.List aria-label="Customise dashboard tabs">
            <Tabs.Tab id="widgets">Widgets</Tabs.Tab>
            <Tabs.Tab id="layout">Layout</Tabs.Tab>
            <Tabs.Tab id="settings">Settings</Tabs.Tab>
            {/* History sits between Settings and Filters — the
                intent order is shape → identity → history → filters
                so users find "roll back" next to the identity
                controls that most often trigger it. */}
            <Tabs.Tab id="history">History</Tabs.Tab>
            <Tabs.Tab id="filters">Filters</Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>
      </Tabs>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {tab === "widgets" ? (
          <WidgetsTab editor={editor} isBuiltIn={isBuiltIn} onOpenCatalogue={onOpenCatalogue} />
        ) : null}
        {tab === "layout" ? <LayoutTab editor={editor} isBuiltIn={isBuiltIn} /> : null}
        {tab === "settings" ? (
          <SettingsTab
            editor={editor}
            isBuiltIn={isBuiltIn}
            onDelete={onDelete}
            onOpenShare={onOpenShare}
          />
        ) : null}
        {tab === "history" ? (
          <HistoryTab
            dashboard={source}
            isBuiltIn={isBuiltIn}
            onOpenHistory={() => setHistoryOpen(true)}
            registry={registry}
          />
        ) : null}
        {tab === "filters" ? <FiltersTab editor={editor} isBuiltIn={isBuiltIn} /> : null}
      </div>

      <Separator />
      <footer className="flex items-center gap-2 px-4 py-3">
        {isBuiltIn ? (
          <Button className="w-full" onPress={onClose} size="sm" variant="primary">
            Close
          </Button>
        ) : (
          <>
            <Button
              isDisabled={!editor.isDirty || editor.isSaving}
              onPress={handleDiscard}
              size="sm"
              variant="ghost"
            >
              Discard
            </Button>
            <div className="flex-1" />
            <Button
              aria-label="Undo last change"
              isDisabled={!editor.canUndo}
              isIconOnly
              onPress={editor.undo}
              size="sm"
              variant="secondary"
            >
              <Iconify className="size-4" icon="arrow-uturn-cw-left" />
            </Button>
            <Button
              aria-label="Redo last undone change"
              isDisabled={!editor.canRedo}
              isIconOnly
              onPress={editor.redo}
              size="sm"
              variant="secondary"
            >
              <Iconify className="size-4" icon="arrow-uturn-cw-right" />
            </Button>
            <Button
              isDisabled={!editor.isDirty || editor.isSaving}
              isPending={editor.isSaving}
              onPress={handleSave}
              size="sm"
              variant="primary"
            >
              Save
            </Button>
          </>
        )}
      </footer>

      {/* Version-history modal mount — controlled from the panel so
          the History tab can open it without lifting the state up
          into the route. Reads its own version log through the
          registry hook so the modal stays in sync with peer-tab
          restores. */}
      <VersionHistoryDialog
        dashboard={source}
        isOpen={isHistoryOpen}
        onOpenChange={setHistoryOpen}
        registry={registry}
      />
    </div>
  );
}

/**
 * Widgets tab — lists the widgets on the current dashboard with
 * per-row remove + drag handle (reserved for future keyboard
 * reorder). Above the list, an "Add widget" button opens the
 * catalogue drawer.
 */
function WidgetsTab({
  editor,
  isBuiltIn,
  onOpenCatalogue,
}: {
  editor: UseDashboardEditor;
  isBuiltIn: boolean;
  onOpenCatalogue: () => void;
}): ReactNode {
  const widgets = editor.draft.widgets;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium text-foreground">Widgets on this dashboard</p>
        <Chip className="ms-auto" size="sm" variant="soft">
          <Chip.Label>{widgets.length}</Chip.Label>
        </Chip>
      </div>

      <Button isDisabled={isBuiltIn} onPress={onOpenCatalogue} size="sm" variant="secondary">
        <Iconify className="size-4" icon="plus" />
        Add widget
      </Button>

      {widgets.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-xs text-muted">
          No widgets yet. Click <strong>Add widget</strong> to browse the catalogue.
        </div>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
          {widgets.map((widget) => (
            <WidgetRow key={widget.id} editor={editor} isBuiltIn={isBuiltIn} widget={widget} />
          ))}
        </ul>
      )}
    </div>
  );
}

/** A single widget row in the Widgets tab. */
function WidgetRow({
  editor,
  isBuiltIn,
  widget,
}: {
  editor: UseDashboardEditor;
  isBuiltIn: boolean;
  widget: WidgetInstance;
}): ReactNode {
  const catalogue = findWidget(widget.widgetType);
  const label = widget.title ?? catalogue?.title ?? widget.widgetType;
  const description = catalogue?.description ?? "Widget definition not found.";

  return (
    <li className="flex items-start gap-3 px-3 py-3">
      {/* WHY: The plain Iconify tile that used to live here read as
          "empty box" against real widget cards. Swapping it for the
          shared WidgetIllustration keeps the customise panel and the
          Add-widget drawer visually consistent — same poster, same
          semantic-token palette — so a user scanning the list can
          quickly recall what each row will render. */}
      <WidgetIllustration
        className="size-16 shrink-0"
        cohort={catalogue?.cohort}
        widgetKey={widget.widgetType}
      />
      <div className="min-w-0 flex-1">
        <Label className="text-sm font-medium text-foreground">{label}</Label>
        <p className="line-clamp-2 text-xs text-muted">{description}</p>
      </div>
      <Button
        aria-label={`Remove ${label}`}
        isDisabled={isBuiltIn}
        isIconOnly
        onPress={() => editor.removeWidget(widget.id)}
        size="sm"
        variant="ghost"
      >
        <Iconify className="size-4" icon="xmark" />
      </Button>
    </li>
  );
}

/** Layout tab — grid vs flow mode + density + reset. */
function LayoutTab({
  editor,
  isBuiltIn,
}: {
  editor: UseDashboardEditor;
  isBuiltIn: boolean;
}): ReactNode {
  // WHY: Read density with the same cozy fallback the storage
  // adapter uses so a dashboard document written before the field
  // shipped still renders the correct "active" state on this
  // segmented control.
  const activeDensity = editor.draft.density ?? "cozy";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium text-foreground">Layout mode</Label>
        <p className="text-xs text-muted">
          Grid packs widgets in a responsive column-based grid. Flow stacks widgets vertically, one
          per row — good for report-style pages.
        </p>
        <div className="flex gap-2">
          <Button
            aria-pressed={editor.draft.layoutMode === "grid"}
            isDisabled={isBuiltIn}
            onPress={() => editor.setLayoutMode("grid")}
            size="sm"
            variant={editor.draft.layoutMode === "grid" ? "primary" : "secondary"}
          >
            <Iconify className="size-4" icon="layers" />
            Grid
          </Button>
          <Button
            aria-pressed={editor.draft.layoutMode === "flow"}
            isDisabled={isBuiltIn}
            onPress={() => editor.setLayoutMode("flow")}
            size="sm"
            variant={editor.draft.layoutMode === "flow" ? "primary" : "secondary"}
          >
            <Iconify className="size-4" icon="dots-3-horizontal" />
            Flow
          </Button>
        </div>
      </div>

      <Separator />

      {/* Density picker — sits below the Grid/Flow buttons so the
          user hits "shape → spacing" in the natural top-down
          reading order. Segmented three-way control mirrors the
          layout-mode row so the two feel like siblings. */}
      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium text-foreground">Density</Label>
        <p className="text-xs text-muted">
          Tighten the grid for dense operator boards, or loosen it for presentation surfaces. Cozy
          is the default.
        </p>
        <div className="flex gap-2">
          <Button
            aria-pressed={activeDensity === "compact"}
            isDisabled={isBuiltIn}
            onPress={() => editor.setDensity("compact")}
            size="sm"
            variant={activeDensity === "compact" ? "primary" : "secondary"}
          >
            <Iconify className="size-4" icon="dots-3-horizontal" />
            Compact
          </Button>
          <Button
            aria-pressed={activeDensity === "cozy"}
            isDisabled={isBuiltIn}
            onPress={() => editor.setDensity("cozy")}
            size="sm"
            variant={activeDensity === "cozy" ? "primary" : "secondary"}
          >
            <Iconify className="size-4" icon="layers" />
            Cozy
          </Button>
          <Button
            aria-pressed={activeDensity === "comfortable"}
            isDisabled={isBuiltIn}
            onPress={() => editor.setDensity("comfortable")}
            size="sm"
            variant={activeDensity === "comfortable" ? "primary" : "secondary"}
          >
            {/* `square-chart-bar` reads as a spaced grid of cells,
                which fits the "extra breathing room" preset better
                than the closest generic layout glyph. */}
            <Iconify className="size-4" icon="square-chart-bar" />
            Comfortable
          </Button>
        </div>
      </div>

      <Separator />

      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium text-foreground">Breakpoints</Label>
        <div className="rounded-lg border border-border">
          <BreakpointRow columns={12} icon="tv" label="Desktop (lg)" />
          <Separator />
          <BreakpointRow columns={8} icon="mobile" label="Tablet (md)" />
          <Separator />
          <BreakpointRow columns={4} icon="mobile" label="Mobile (sm)" />
        </div>
        <p className="text-xs text-muted">
          Column counts are fixed to keep widget authors sane. Widths on the canvas snap to these
          columns.
        </p>
      </div>
    </div>
  );
}

function BreakpointRow({
  columns,
  icon,
  label,
}: {
  columns: number;
  icon: string;
  label: string;
}): ReactNode {
  return (
    <div className="flex items-center gap-3 px-3 py-2 text-sm">
      <Iconify className="size-4 text-muted" icon={icon} />
      <span className="text-foreground">{label}</span>
      <Chip className="ms-auto" size="sm" variant="soft">
        <Chip.Label>{columns} cols</Chip.Label>
      </Chip>
    </div>
  );
}

/** Settings tab — name / icon / colour / visibility / pin / default / delete. */
function SettingsTab({
  editor,
  isBuiltIn,
  onDelete,
  onOpenShare,
}: {
  editor: UseDashboardEditor;
  isBuiltIn: boolean;
  onDelete: () => Promise<void>;
  onOpenShare: () => void;
}): ReactNode {
  return (
    <div className="flex flex-col gap-4">
      <TextField isDisabled={isBuiltIn} onChange={editor.setName} value={editor.draft.name}>
        <Label htmlFor="dashboard-name">Name</Label>
        <Input id="dashboard-name" variant="secondary" />
      </TextField>

      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium text-foreground">Icon</Label>
        <div className="flex flex-wrap gap-1.5">
          {ICON_CHOICES.map((choice) => {
            const active = editor.draft.icon === choice;

            return (
              <button
                key={choice}
                aria-pressed={active}
                className={[
                  "flex size-9 items-center justify-center rounded-lg border transition-colors",
                  active
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border text-muted hover:border-foreground/40 hover:text-foreground",
                  isBuiltIn ? "cursor-not-allowed opacity-50" : "",
                ].join(" ")}
                disabled={isBuiltIn}
                onClick={() => editor.setIcon(choice)}
                type="button"
              >
                <Iconify className="size-4" icon={choice} />
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium text-foreground">Colour</Label>
        <div className="flex flex-wrap gap-1.5">
          {COLOR_CHOICES.map((choice) => {
            const active = editor.draft.color === choice.id;

            return (
              <button
                key={choice.id}
                aria-label={choice.label}
                aria-pressed={active}
                className={[
                  "flex size-8 items-center justify-center rounded-full border-2 transition",
                  active ? "border-foreground" : "border-transparent",
                  isBuiltIn ? "cursor-not-allowed opacity-50" : "",
                ].join(" ")}
                disabled={isBuiltIn}
                onClick={() => editor.setColor(active ? undefined : choice.id)}
                type="button"
              >
                <span className={`size-5 rounded-full ${choice.className}`} />
              </button>
            );
          })}
        </div>
      </div>

      <Separator />

      <SwitchRow
        description="Only you can see private dashboards. Sharing generates an embed link anyone with the URL can view."
        isDisabled={isBuiltIn}
        isSelected={editor.draft.visibility === "shared"}
        label="Shared with tenant"
        onChange={(next) => editor.setVisibility(next ? "shared" : "private")}
      />

      <SwitchRow
        description="Pinned dashboards appear in the sidebar under Overview."
        isDisabled={isBuiltIn}
        isSelected={editor.draft.isPinned}
        label="Pin to sidebar"
        onChange={(next) => editor.setPinned(next)}
      />

      <SwitchRow
        description="The default dashboard is what `/dashboard` opens to."
        isDisabled={isBuiltIn}
        isSelected={editor.draft.isDefault}
        label="Set as default"
        onChange={(next) => editor.setIsDefault(next)}
      />

      <Separator />

      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium text-foreground">Share</Label>
        <p className="text-xs text-muted">
          Generate a public embed link. Anyone with the link can view this dashboard read-only — no
          login required.
        </p>
        <Button
          isDisabled={isBuiltIn || editor.draft.visibility !== "shared"}
          onPress={onOpenShare}
          size="sm"
          variant="secondary"
        >
          <Iconify className="size-4" icon="share" />
          Manage share links
        </Button>
        {editor.draft.visibility !== "shared" && !isBuiltIn ? (
          <p className="text-xs text-muted">
            Enable <strong>Shared with tenant</strong> first to issue share links.
          </p>
        ) : null}
      </div>

      <Separator />

      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium text-foreground">Danger zone</Label>
        <Button isDisabled={isBuiltIn} onPress={onDelete} size="sm" variant="danger-soft">
          <Iconify className="size-4" icon="trash-bin" />
          Delete dashboard
        </Button>
      </div>
    </div>
  );
}

/** Filters tab — dashboard-wide date range + scope. */
function FiltersTab({
  editor,
  isBuiltIn,
}: {
  editor: UseDashboardEditor;
  isBuiltIn: boolean;
}): ReactNode {
  const filters = editor.draft.filters ?? {};

  return (
    <div className="flex flex-col gap-4">
      <TextField
        isDisabled={isBuiltIn}
        onChange={(next) =>
          editor.setFilters({
            ...filters,
            dateFrom: next || undefined,
          })
        }
        value={filters.dateFrom ?? ""}
      >
        <Label htmlFor="filters-date-from">Date from</Label>
        <Input id="filters-date-from" placeholder="YYYY-MM-DD" type="date" variant="secondary" />
      </TextField>
      <TextField
        isDisabled={isBuiltIn}
        onChange={(next) =>
          editor.setFilters({
            ...filters,
            dateTo: next || undefined,
          })
        }
        value={filters.dateTo ?? ""}
      >
        <Label htmlFor="filters-date-to">Date to</Label>
        <Input id="filters-date-to" placeholder="YYYY-MM-DD" type="date" variant="secondary" />
      </TextField>

      <Separator />

      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium text-foreground">Scope override</Label>
        <p className="text-xs text-muted">
          Widgets that opt in read these filters. Leave blank to inherit the shell's global scope
          picker.
        </p>
        <TextField
          isDisabled={isBuiltIn}
          onChange={(next) =>
            editor.setFilters({
              ...filters,
              scope: { ...filters.scope, branchId: next || undefined },
            })
          }
          value={filters.scope?.branchId ?? ""}
        >
          <Label>Branch ID</Label>
          <Input placeholder="branch-uuid" variant="secondary" />
        </TextField>
      </div>
    </div>
  );
}

function SwitchRow({
  description,
  isDisabled,
  isSelected,
  label,
  onChange,
}: {
  description: string;
  isDisabled: boolean;
  isSelected: boolean;
  label: string;
  onChange: (next: boolean) => void;
}): ReactNode {
  return (
    <div className="flex items-start gap-3">
      <div className="min-w-0 flex-1">
        <Label className="text-sm font-medium text-foreground">{label}</Label>
        <p className="text-xs text-muted">{description}</p>
      </div>
      <Switch
        aria-label={label}
        isDisabled={isDisabled}
        isSelected={isSelected}
        onChange={onChange}
      >
        <Switch.Content>
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
        </Switch.Content>
      </Switch>
    </div>
  );
}

/**
 * Compact relative-time helper reused by the history tab preview
 * strip. Duplicated (rather than lifted into a shared util) with
 * the version-history-dialog copy because both files are small and
 * self-contained; a shared util would grow this module's public
 * surface without meaningfully DRY-ing the code path.
 */
function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();

  if (Number.isNaN(then)) {
    return iso;
  }

  const deltaMs = Date.now() - then;

  if (deltaMs < 0) {
    return new Date(iso).toLocaleString();
  }

  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;

  if (deltaMs < minute) return "just now";
  if (deltaMs < hour) {
    const value = Math.floor(deltaMs / minute);

    return `${value}m ago`;
  }
  if (deltaMs < day) {
    const value = Math.floor(deltaMs / hour);

    return `${value}h ago`;
  }
  if (deltaMs < 2 * day) return "yesterday";
  if (deltaMs < week) {
    const value = Math.floor(deltaMs / day);

    return `${value}d ago`;
  }

  return new Date(iso).toLocaleDateString();
}

/**
 * History tab — a compact preview of the persisted version log
 * plus a full-width button that opens the {@link VersionHistoryDialog}
 * modal for the detailed two-column browsing experience.
 *
 * Built-in dashboards render this tab in a view-only mode: the
 * preview strip still shows (so users understand what history
 * they'd inherit on duplicate), but the restore path is
 * unavailable — the modal itself hides the Restore button behind
 * a Tooltip when the dashboard is `isBuiltIn`.
 */
function HistoryTab({
  dashboard,
  isBuiltIn,
  onOpenHistory,
  registry,
}: {
  dashboard: Dashboard;
  isBuiltIn: boolean;
  onOpenHistory: () => void;
  registry: UseDashboardsResult;
}): ReactNode {
  const [snapshots, setSnapshots] = useState<readonly DashboardVersionSnapshot[]>([]);
  const [isLoading, setLoading] = useState(true);

  const reload = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const list = await registry.listVersions(dashboard.id);

      setSnapshots(list);
    } finally {
      setLoading(false);
    }
  }, [dashboard.id, registry]);

  // Reload the preview strip whenever the dashboard identity or
  // version changes — a save (or a restore, which itself bumps the
  // version) drops a new snapshot at the top of the log and we
  // want the strip to reflect it immediately.
  useEffect(() => {
    void reload();
  }, [reload, dashboard.version]);

  // Show at most 3 rows in the tab preview — the modal handles the
  // full log when the user wants to browse deeper.
  const preview = snapshots.slice(0, 3);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-medium text-foreground">Version history</p>
        <p className="text-xs leading-5 text-muted">
          Every save writes a checkpoint. Open the full history to review older versions and restore
          this dashboard to any of them.
          {isBuiltIn
            ? " Built-in dashboards can’t be restored — duplicate first to unlock the restore path."
            : ""}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Label className="text-xs font-medium tracking-wide text-foreground uppercase">
            Recent snapshots
          </Label>
          {snapshots.length > 0 ? (
            <Chip className="ms-auto" size="sm" variant="soft">
              <Chip.Label>{snapshots.length} total</Chip.Label>
            </Chip>
          ) : null}
        </div>

        {isLoading ? (
          <p className="text-xs text-muted">Loading…</p>
        ) : preview.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-xs text-muted">
            No history yet — every save creates a version.
          </div>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
            {preview.map((snapshot) => (
              <li key={snapshot.id} className="flex items-center gap-2 px-3 py-2">
                <Chip size="sm" variant="soft">
                  <Chip.Label>v{snapshot.version}</Chip.Label>
                </Chip>
                <span className="text-xs text-muted">{relativeTime(snapshot.changedAt)}</span>
                <span className="truncate text-xs text-foreground" title={snapshot.summary}>
                  {snapshot.summary ?? "Snapshot captured before an edit."}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {isBuiltIn ? (
        <Tooltip>
          {/* Wrapping the disabled action in a Tooltip so the user
              still sees why restoring is blocked without needing to
              guess. */}
          <Button className="w-full" onPress={onOpenHistory} size="sm" variant="secondary">
            <Iconify className="size-4" icon="clock" />
            Open version history
          </Button>
          <Tooltip.Content>
            View-only for built-in dashboards. Duplicate to unlock restore.
          </Tooltip.Content>
        </Tooltip>
      ) : (
        <Button className="w-full" onPress={onOpenHistory} size="sm" variant="secondary">
          <Iconify className="size-4" icon="clock" />
          Open version history
        </Button>
      )}
    </div>
  );
}
