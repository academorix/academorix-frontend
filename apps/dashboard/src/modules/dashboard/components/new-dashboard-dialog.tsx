/**
 * @file new-dashboard-dialog.tsx
 * @module modules/dashboard/components/new-dashboard-dialog
 *
 * @description
 * Modal dialog that creates a new dashboard. The user picks a name,
 * an icon, and a template — templates seed the initial widget set
 * so a fresh dashboard renders with useful defaults instead of a
 * blank canvas.
 *
 * On success the caller navigates the browser to the new dashboard
 * so the user drops straight into editing.
 */

import { Button, Chip, Input, Label, Modal, TextField, toast } from "@heroui/react";
import { useState } from "react";

import type { Dashboard, DashboardTemplate } from "@/modules/dashboard/dashboards";
import type { UseDashboardsResult } from "@/modules/dashboard/dashboards";
import type { ReactNode } from "react";

import { Iconify } from "@/icons/iconify";
import { WidgetIllustration } from "@/modules/dashboard/components/widget-illustrations";
import { DASHBOARD_TEMPLATES } from "@/modules/dashboard/dashboards";
import { findWidget } from "@/modules/dashboard/widgets.catalogue";

/**
 * Maximum number of widget illustrations rendered in the template
 * preview strip. Kept low (three) so each thumbnail stays legible
 * at the card's 64px height — more than that starts to look like a
 * mosaic instead of a preview.
 */
const PREVIEW_STRIP_LIMIT = 3;

export interface NewDashboardDialogProps {
  registry: UseDashboardsResult;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the newly-created dashboard on success. */
  onCreated: (dashboard: Dashboard) => void;
}

export function NewDashboardDialog({
  registry,
  isOpen,
  onOpenChange,
  onCreated,
}: NewDashboardDialogProps): ReactNode {
  const [name, setName] = useState("");
  // `DASHBOARD_TEMPLATES[0]` is guaranteed defined — the catalogue
  // ships at least one template — but TS narrows array access to
  // `T | undefined`. The non-null assertion is safe here and at
  // the reset() site below.
  const [template, setTemplate] = useState<DashboardTemplate>(DASHBOARD_TEMPLATES[0]!);
  const [icon, setIcon] = useState<string>("square-check");

  const reset = (): void => {
    setName("");
    setTemplate(DASHBOARD_TEMPLATES[0]!);
    setIcon("square-check");
  };

  const handleCreate = async (): Promise<void> => {
    const trimmed = name.trim();

    if (!trimmed) {
      toast.warning("Give your dashboard a name to continue.");

      return;
    }

    try {
      const dashboard = await registry.create({
        name: trimmed,
        icon,
        color: template.color,
        layoutMode: template.layoutMode,
        fromTemplate: template.id,
      });

      toast.success("Dashboard created", { description: `Opening ${dashboard.name}.` });
      onCreated(dashboard);
      onOpenChange(false);
      reset();
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Could not create dashboard.";

      toast.danger("Create failed", { description: message });
    }
  };

  return (
    <Modal.Backdrop
      isOpen={isOpen}
      onOpenChange={(open) => {
        onOpenChange(open);

        if (!open) reset();
      }}
    >
      <Modal.Container>
        <Modal.Dialog className="sm:max-w-lg">
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Icon className="bg-accent-soft text-accent-soft-foreground">
              <Iconify className="size-4" icon="plus" />
            </Modal.Icon>
            <Modal.Heading>New dashboard</Modal.Heading>
            <p className="mt-1.5 text-sm leading-5 text-muted">
              Give it a name, pick a template, and start customising. You can rename or reset the
              layout later.
            </p>
          </Modal.Header>
          <Modal.Body>
            <div className="flex flex-col gap-4">
              <TextField onChange={setName} value={name}>
                <Label>Name</Label>
                <Input
                  autoFocus
                  id="new-dashboard-name"
                  placeholder="My athletics board"
                  variant="secondary"
                />
              </TextField>

              <div className="flex flex-col gap-2">
                <Label>Template</Label>
                <p className="text-xs text-muted">
                  Templates seed the widget set. Pick <strong>Blank</strong> if you'd rather build
                  from scratch.
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {DASHBOARD_TEMPLATES.map((entry) => {
                    const active = entry.id === template.id;

                    return (
                      <TemplateCard
                        key={entry.id}
                        isActive={active}
                        onSelect={() => setTemplate(entry)}
                        template={entry}
                      />
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Icon</Label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "square-check",
                    "chart-column",
                    "chart-line",
                    "persons",
                    "circle-dollar",
                    "shield-check",
                    "sparkles",
                    "clock",
                  ].map((choice) => {
                    const active = choice === icon;

                    return (
                      <button
                        key={choice}
                        aria-pressed={active}
                        className={[
                          "flex size-9 items-center justify-center rounded-lg border transition-colors",
                          active
                            ? "border-accent bg-accent/10 text-accent"
                            : "border-border text-muted hover:border-foreground/40 hover:text-foreground",
                        ].join(" ")}
                        onClick={() => setIcon(choice)}
                        type="button"
                      >
                        <Iconify className="size-4" icon={choice} />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button onPress={() => onOpenChange(false)} size="sm" variant="ghost">
              Cancel
            </Button>
            <Button
              isDisabled={!name.trim() || registry.isMutating}
              isPending={registry.isMutating}
              onPress={handleCreate}
              size="sm"
              variant="primary"
            >
              Create dashboard
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

/**
 * Single template card in the gallery. Composes a top preview strip
 * of up to {@link PREVIEW_STRIP_LIMIT} widget illustrations with a
 * bottom metadata row (name + widget-count chip + description).
 *
 * ## Layout
 *
 *   * The card is a `<button>` so keyboard + screen-reader users
 *     get press semantics for free.
 *   * Active state uses an accent-tinted border + background so the
 *     card visibly presses without shifting position (avoids grid
 *     re-layout on click).
 *   * The "Blank" template renders a subdued placeholder message in
 *     the preview strip — no widgets means no illustrations, and a
 *     neutral caption reads better than an empty gap.
 */
function TemplateCard({
  isActive,
  onSelect,
  template,
}: {
  isActive: boolean;
  onSelect: () => void;
  template: DashboardTemplate;
}): ReactNode {
  // Cap the preview strip so cards stay comfortably legible. Widget
  // keys the catalogue doesn't know about still contribute a
  // cohort-defaulted illustration via `WidgetIllustration`, so a
  // module-contributed widget still renders a poster.
  const previewKeys = template.keys.slice(0, PREVIEW_STRIP_LIMIT);
  const widgetCount = template.keys.length;

  return (
    <button
      aria-label={`Use "${template.name}" template`}
      aria-pressed={isActive}
      className={[
        "flex flex-col gap-3 rounded-xl border p-3 text-start transition-colors",
        isActive
          ? // Accent-tinted background + accent border communicates
            // the pressed state without a layout shift.
            "border-accent bg-accent/10"
          : "border-border hover:border-foreground/40 hover:bg-surface-secondary/40",
      ].join(" ")}
      onClick={onSelect}
      type="button"
    >
      {/* Preview strip — three illustrations for a normal template,
          a placeholder message for the Blank one. The strip sits
          on top so the visual is what the user reads first. */}
      <div className="flex h-16 items-center gap-1.5 overflow-hidden rounded-lg bg-surface-secondary/60 px-1.5">
        {previewKeys.length === 0 ? (
          <div className="flex w-full items-center justify-center gap-1.5 text-xs text-muted">
            <Iconify className="size-4" icon="sparkles" />
            <span>Start from empty</span>
          </div>
        ) : (
          previewKeys.map((key) => {
            const entry = findWidget(key);

            return (
              <WidgetIllustration
                key={key}
                className="aspect-video h-full min-w-0 flex-1"
                cohort={entry?.cohort}
                widgetKey={key}
              />
            );
          })
        )}
      </div>

      {/* Metadata row — icon + name + widget count on the top line,
          description on the second so long names + long descriptions
          both stay legible. */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span
            className={[
              "flex size-7 items-center justify-center rounded-lg",
              isActive ? "bg-accent/20 text-accent" : "bg-surface-secondary text-muted",
            ].join(" ")}
          >
            <Iconify className="size-4" icon={template.icon} />
          </span>
          <span className="text-sm font-medium text-foreground">{template.name}</span>
          <Chip className="ms-auto" size="sm" variant="soft">
            <Chip.Label>
              {widgetCount === 0 ? "Empty" : `${widgetCount} widget${widgetCount === 1 ? "" : "s"}`}
            </Chip.Label>
          </Chip>
        </div>
        <p className="text-xs leading-4 text-muted">{template.description}</p>
      </div>
    </button>
  );
}
