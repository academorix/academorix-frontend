/**
 * @file scope-cascade-tooltip.tsx
 * @module modules/settings/components/scope-cascade-tooltip
 *
 * @description
 * The `(?)` info icon next to every setting label. On hover it renders a
 * HeroUI Pro `HoverCard` showing:
 *  - The field's description
 *  - The effective value (bold, highlighted)
 *  - A per-scope table with the value at every level of the hierarchy
 */

import { Chip } from "@heroui/react";
import { HoverCard } from "@heroui-pro/react";

import type { SettingField, SettingResolution } from "@/modules/settings/scope/types";
import type { ReactNode } from "react";

import { Iconify } from "@/icons/iconify";
import { SCOPE_HIERARCHY, SCOPE_ICON, SCOPE_LABEL } from "@/modules/settings/scope/types";

type ScopeCascadeTooltipProps = {
  field: SettingField;
  resolution: SettingResolution;
};

/**
 * Format an arbitrary stored value for display in the cascade tooltip.
 * Booleans render as On/Off, arrays render as counts, objects render as
 * their `text`/`label`/`name` when present.
 */
function formatValue(value: unknown, field: SettingField): ReactNode {
  if (value === undefined || value === null || value === "")
    return <span className="text-muted italic">—</span>;

  if (typeof value === "boolean") {
    return value ? "On" : "Off";
  }
  if (typeof value === "number") {
    const suffix = field.unit ? ` ${field.unit}` : "";

    if (field.type === "percent") return `${Math.round(value * 100)}%`;

    return `${value}${suffix}`;
  }
  if (Array.isArray(value)) {
    return `${value.length} item${value.length === 1 ? "" : "s"}`;
  }
  if (typeof value === "object") {
    // Translatable payload — pick the en/ar entry if present.
    const rec = value as Record<string, unknown>;

    for (const key of ["text", "label", "name", "en", "ar"]) {
      if (typeof rec[key] === "string") return rec[key] as string;
    }

    return "<object>";
  }

  return String(value);
}

export function ScopeCascadeTooltip({ field, resolution }: ScopeCascadeTooltipProps) {
  return (
    <HoverCard closeDelay={200} openDelay={300}>
      <HoverCard.Trigger>
        <button
          aria-label={`About ${field.label}`}
          className="inline-flex size-4 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:text-foreground"
          type="button"
        >
          <Iconify className="size-3.5" icon="circle-info" />
        </button>
      </HoverCard.Trigger>
      <HoverCard.Content className="max-w-[360px] min-w-[300px] p-4">
        <HoverCard.Arrow />
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground">{field.label}</p>
            {field.description ? (
              <p className="mt-1 text-xs leading-relaxed text-muted">{field.description}</p>
            ) : null}
          </div>

          <div className="rounded-lg border border-border bg-surface-secondary/40 p-3">
            <p className="text-[10px] font-semibold tracking-wide text-muted uppercase">
              Effective value
            </p>
            <p className="mt-0.5 text-sm font-medium text-foreground">
              {formatValue(resolution.effective, field)}
            </p>
            <p className="mt-0.5 text-[11px] text-muted">
              from{" "}
              <span className="font-medium text-foreground">
                {SCOPE_LABEL[resolution.effectiveScope]}
              </span>
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <p className="text-[10px] font-semibold tracking-wide text-muted uppercase">
              Per scope
            </p>
            <ul className="flex flex-col gap-0.5">
              {SCOPE_HIERARCHY.map((scope) => {
                const value = resolution.perScope[scope];
                const isEffective = scope === resolution.effectiveScope;
                const isDefined =
                  value !== undefined &&
                  !(
                    scope === "system" &&
                    value === field.defaultValue &&
                    resolution.effectiveScope !== "system"
                  );

                return (
                  <li
                    key={scope}
                    className={
                      "flex items-center justify-between gap-3 rounded-md px-2 py-1 text-xs " +
                      (isEffective ? "bg-accent/8 font-medium text-foreground" : "text-muted")
                    }
                  >
                    <span className="flex items-center gap-1.5">
                      <Iconify className="size-3" icon={SCOPE_ICON[scope]} />
                      {SCOPE_LABEL[scope]}
                    </span>
                    <span
                      className={
                        "tabular-nums " +
                        (isDefined || isEffective ? "text-foreground" : "text-muted italic")
                      }
                    >
                      {formatValue(value, field)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          {field.translatable ? (
            <Chip color="accent" size="sm" variant="soft">
              <Iconify className="size-3" icon="globe" />
              <Chip.Label>Translatable</Chip.Label>
            </Chip>
          ) : null}
        </div>
      </HoverCard.Content>
    </HoverCard>
  );
}
