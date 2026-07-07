/**
 * @file pricing-matrix.tsx
 * @module components/marketing/pricing-matrix
 *
 * @description
 * Full plan-comparison matrix rendered as sections, subcategories,
 * and rows. Each row's `values` map declares what the cell should
 * show per plan; the `CompareCell` discriminator lets the renderer
 * pick the right glyph without inspecting strings.
 */

import clsx from "clsx";

import type { CompareCell, CompareSection, Localized, PlanKey, PlanTierData } from "@/lib/types";

import { resolveIcon } from "@/lib/icon-registry";

/** Fixed order for the matrix columns. */
const PLAN_ORDER: readonly PlanKey[] = ["starter", "growth", "pro", "enterprise"] as const;

/** Props for {@link PricingMatrix}. */
export interface PricingMatrixProps {
  sections: readonly Localized<CompareSection>[];
  plans: readonly Localized<PlanTierData>[];
  className?: string;
}

/** Render one cell of the matrix based on its discriminator. */
function renderCell(cell: Localized<CompareCell> | undefined) {
  if (!cell)
    return (
      <span aria-hidden className="text-muted">
        —
      </span>
    );

  switch (cell.type) {
    case "included":
      return (
        <span
          aria-label="Included"
          className="inline-flex size-6 items-center justify-center rounded-full bg-accent/20 text-accent"
        >
          ✓
        </span>
      );
    case "excluded":
      return (
        <span aria-hidden className="text-muted">
          —
        </span>
      );
    case "value":
      return (
        <div className="flex flex-col items-center gap-0.5 text-center">
          <span className="text-sm font-medium text-foreground">{cell.primary}</span>
          {cell.secondary ? <span className="text-xs text-muted">{cell.secondary}</span> : null}
        </div>
      );
    case "custom":
      return (
        <span className="inline-flex items-center rounded-full border border-default/60 bg-default/40 px-2 py-0.5 text-xs font-medium text-foreground">
          Custom
        </span>
      );
    case "addon":
      return (
        <span className="inline-flex items-center rounded-full border border-accent/50 bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
          {cell.label ?? "Add-on"}
        </span>
      );
  }
}

/** Full plan-comparison matrix. */
export function PricingMatrix({ sections, plans, className }: PricingMatrixProps) {
  return (
    <div className={clsx("space-y-16", className)}>
      {sections.map((section) => {
        const Icon = resolveIcon(section.icon);

        return (
          <section key={section.title} className="space-y-6">
            <header className="flex items-start gap-4">
              <span className="inline-flex size-10 items-center justify-center rounded-xl bg-default/60 text-foreground">
                <Icon aria-hidden className="size-5" />
              </span>
              <div className="flex flex-col gap-1">
                <h3 className="text-xl font-semibold tracking-tight text-foreground">
                  {section.title}
                </h3>
                <p className="text-sm text-muted">{section.description}</p>
              </div>
            </header>

            <div className="overflow-x-auto rounded-2xl border border-default/40 bg-surface/60 backdrop-blur-md">
              <table className="w-full min-w-[720px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-default/40">
                    <th className="w-2/5 px-6 py-4 text-start text-xs font-medium tracking-wider text-muted uppercase" />
                    {plans.map((plan) => (
                      <th
                        key={plan.key}
                        className="px-4 py-4 text-center text-xs font-medium tracking-wider text-muted uppercase"
                      >
                        {plan.eyebrow}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {section.subcategories.map((sub, subIndex) => (
                    <>
                      {sub.label ? (
                        <tr key={`sub-${subIndex}`} className="bg-default/20">
                          <td
                            className="px-6 py-2 text-xs font-semibold tracking-wider text-muted uppercase"
                            colSpan={plans.length + 1}
                          >
                            {sub.label}
                          </td>
                        </tr>
                      ) : null}
                      {sub.rows.map((row, rowIndex) => (
                        <tr
                          key={`row-${subIndex}-${rowIndex}`}
                          className="border-t border-default/30"
                        >
                          <td className="px-6 py-3 text-start text-foreground">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-medium">{row.label}</span>
                              {row.info ? (
                                <span className="text-xs text-muted">{row.info}</span>
                              ) : null}
                            </div>
                          </td>
                          {PLAN_ORDER.map((planKey) => (
                            <td key={planKey} className="px-4 py-3 text-center">
                              {renderCell(
                                row.values[planKey] as Localized<CompareCell> | undefined,
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </div>
  );
}
