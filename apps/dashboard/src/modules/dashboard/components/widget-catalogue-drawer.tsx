/**
 * @file widget-catalogue-drawer.tsx
 * @module modules/dashboard/components/widget-catalogue-drawer
 *
 * @description
 * A HeroUI `Drawer` that browses the full widget catalogue and lets
 * the user drop a widget onto the current dashboard's draft. Uses
 * cohort headers, a fuzzy search, and per-row `+ Add` buttons that
 * call `editor.addWidget` with a freshly-minted instance id + a
 * next-available layout item.
 *
 * The drawer opens over the customise panel (right side) so the
 * two feel like a single tool chain — Widgets tab → Add widget →
 * Drawer → click Add → drawer closes → new row appears in the
 * Widgets list.
 */

import { Button, Chip, Drawer, Label, SearchField } from "@heroui/react";
import { useMemo, useState } from "react";

import type { UseDashboardEditor } from "@/modules/dashboard/dashboards";
import type { ReactNode } from "react";

import { Iconify } from "@/icons/iconify";
import { GRID_COLUMNS } from "@/modules/dashboard/dashboards";
import { WidgetIllustration } from "@/modules/dashboard/components/widget-illustrations";
import { widgetsByCohort } from "@/modules/dashboard/widgets.catalogue";

/**
 * Random UUID helper — same shim used inside the storage adapter.
 */
function randomId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `id-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
}

export interface WidgetCatalogueDrawerProps {
  editor: UseDashboardEditor;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WidgetCatalogueDrawer({
  editor,
  isOpen,
  onOpenChange,
}: WidgetCatalogueDrawerProps): ReactNode {
  const [query, setQuery] = useState("");
  const cohorts = useMemo(() => widgetsByCohort(), []);
  const needle = query.trim().toLowerCase();

  const filtered = cohorts
    .map((group) => ({
      ...group,
      widgets: group.widgets.filter(
        (widget) =>
          !needle ||
          widget.title.toLowerCase().includes(needle) ||
          widget.description.toLowerCase().includes(needle) ||
          widget.key.toLowerCase().includes(needle),
      ),
    }))
    .filter((group) => group.widgets.length > 0);

  const handleAdd = (widgetType: string, span: "full" | "half" | "third"): void => {
    const widthFor: Record<typeof span, { lg: number; md: number; sm: number }> = {
      full: { lg: GRID_COLUMNS.lg, md: GRID_COLUMNS.md, sm: GRID_COLUMNS.sm },
      half: {
        lg: Math.max(1, Math.floor(GRID_COLUMNS.lg / 2)),
        md: Math.max(1, Math.floor(GRID_COLUMNS.md / 2)),
        sm: GRID_COLUMNS.sm,
      },
      third: {
        lg: Math.max(1, Math.floor(GRID_COLUMNS.lg / 3)),
        md: Math.max(1, Math.floor(GRID_COLUMNS.md / 3)),
        sm: GRID_COLUMNS.sm,
      },
    };

    const width = widthFor[span];
    // Place the widget at the visual tail. Real react-grid-layout
    // would recompute Y; here we push to `y: Number.MAX_SAFE_INTEGER`
    // so any auto-arranger sinks it last.
    const yTail = 9_999;

    editor.addWidget(
      { id: randomId(), widgetType },
      {
        widgetId: "__ignored__",
        x: 0,
        y: yTail,
        w: width.lg,
        h: span === "full" ? 3 : 4,
      },
    );
  };

  return (
    <Drawer.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
      <Drawer.Content placement="right">
        {/*
         * WHY the m-2 + rounded-2xl on Drawer.Dialog: HeroUI's Drawer
         * doesn't ship an `isDetached` prop like HeroUI Pro's Sheet, so
         * we mirror the same "float" affordance by insetting the visible
         * dialog surface. Drawer.Content is a transparent positioning
         * wrapper, Drawer.Dialog is the panel with the shadow — margins
         * on the dialog produce a proper gap on every side while the
         * Backdrop keeps its fullscreen scrim.
         */}
        <Drawer.Dialog className="m-2 rounded-2xl">
          <Drawer.CloseTrigger />
          <Drawer.Header>
            <div className="flex items-center gap-2">
              <Iconify className="size-4 text-accent" icon="plus" />
              <Drawer.Heading>Add widget</Drawer.Heading>
            </div>
            <SearchField aria-label="Filter widgets" onChange={setQuery} value={query}>
              <SearchField.Group>
                <SearchField.SearchIcon />
                <SearchField.Input placeholder="Filter widgets…" />
                <SearchField.ClearButton onPress={() => setQuery("")} />
              </SearchField.Group>
            </SearchField>
          </Drawer.Header>
          <Drawer.Body>
            {/*
             * WHY the flex-column wrapper + explicit pt/pb: the
             * Drawer.Dialog inherits `p-6` from the compound, but the
             * scrollable Body sits inside that box and its first/last
             * children still kiss the surrounding padding. Adding
             * `pt-1 pb-3` here restores a tiny top breather + a
             * generous bottom pad so the last cohort's action row
             * doesn't collide with the footer's border-top.
             */}
            <div className="flex flex-col gap-5 px-1 pt-1 pb-3">
              {filtered.length === 0 ? (
                <p className="text-sm text-muted">
                  No widgets match your query. Try a shorter term.
                </p>
              ) : null}
              {filtered.map((group) => (
                <section key={group.cohort} className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Iconify className="size-4 text-muted" icon={group.icon} />
                    <h4 className="text-sm font-semibold text-foreground">{group.label}</h4>
                    <Chip className="ms-auto" size="sm" variant="soft">
                      <Chip.Label>{group.widgets.length}</Chip.Label>
                    </Chip>
                  </div>
                  <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
                    {group.widgets.map((widget) => (
                      <li key={widget.key} className="flex items-start gap-3 px-3 py-3">
                        {/* WHY: Replace the plain Iconify square with a
                            proper WidgetIllustration so the drawer
                            previews match every other surface (customise
                            panel, template gallery, empty state). The
                            illustration reads the widget key first and
                            falls back to a cohort default so future
                            catalogue additions get a preview for free. */}
                        <WidgetIllustration
                          className="size-20 shrink-0"
                          cohort={widget.cohort}
                          widgetKey={widget.key}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            {/* The Iconify chip stays next to the label
                                as a small type indicator — the poster
                                communicates the shape, the icon
                                reinforces the category at a glance. */}
                            <Iconify className="size-3.5 text-muted" icon={widget.icon} />
                            <Label className="text-sm font-medium text-foreground">
                              {widget.title}
                            </Label>
                          </div>
                          <p className="mt-1 text-xs text-muted">{widget.description}</p>
                        </div>
                        <Button
                          aria-label={`Add ${widget.title}`}
                          className="mt-1"
                          onPress={() => handleAdd(widget.key, widget.span)}
                          size="sm"
                          variant="secondary"
                        >
                          <Iconify className="size-4" icon="plus" />
                          Add
                        </Button>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </Drawer.Body>
          {/*
           * WHY pt-3 on the footer: the compound doesn't add a
           * separator between Body and Footer, so a flush "Done"
           * button collides visually with the last row above.
           * A symmetric top pad + subtle border-top lifts the button
           * off the scroll edge and matches the notification bell's
           * footer treatment.
           */}
          <Drawer.Footer className="border-t border-border pt-3">
            <Button
              className="w-full"
              onPress={() => onOpenChange(false)}
              size="sm"
              variant="primary"
            >
              Done
            </Button>
          </Drawer.Footer>
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer.Backdrop>
  );
}
