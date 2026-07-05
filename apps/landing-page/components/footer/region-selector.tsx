/**
 * @file region-selector.tsx
 * @module components/footer/region-selector
 *
 * @description
 * Footer utility-strip control that lets a visitor pick their commercial
 * region (MENA / Europe / Americas). The choice will eventually drive:
 *
 *  - localised pricing (regional currency + tax handling),
 *  - data-residency copy on the marketing pages,
 *  - which onboarding funnel receives the "Talk to sales" form.
 *
 * For now the switcher is a pure UI stub — it holds the selection in
 * component state and logs the change so we can validate the visual
 * design before the backend & analytics wiring lands. See TODO comment
 * below for the persistence hook-up plan.
 *
 * The trigger mirrors {@link LanguageSwitcher}'s `variant="compact"` look
 * so both controls sit next to each other in the footer without visual
 * mismatch.
 */

"use client";

import { ChevronDownIcon, GlobeAltIcon } from "@academorix/ui/icons/outline";
import { Dropdown, Label } from "@academorix/ui/react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import type { Key, ReactNode } from "react";

/** Commercial regions the selector exposes. */
export type Region = "mena" | "europe" | "americas";

/** Ordered list of regions — MENA first because it's our home market. */
const REGIONS: readonly Region[] = ["mena", "europe", "americas"] as const;

/** Props for {@link RegionSelector}. */
export interface RegionSelectorProps {
  /**
   * Initial region — mostly a hook for tests. In production the value
   * will eventually come from the visitor's persisted cookie / geo-IP
   * hint, so accept an override even before that pipeline lands.
   */
  defaultRegion?: Region;
  /** Popover placement (matches HeroUI Dropdown placement tokens). */
  placement?: "bottom start" | "bottom end" | "top start" | "top end";
  /** Extra classes on the trigger. */
  className?: string;
}

/**
 * Compact region switcher for the footer utility bar. Client Component —
 * `useState` + `onAction` require the client boundary.
 */
export function RegionSelector({
  defaultRegion = "mena",
  placement = "top end",
  className,
}: RegionSelectorProps): ReactNode {
  const t = useTranslations("footer");
  const [region, setRegion] = useState<Region>(defaultRegion);

  const handleAction = (key: Key): void => {
    const next = key as Region;

    if (next === region) {
      return;
    }

    // TODO: persist the region selection.
    //   1) Write it to a `NEXT_REGION` cookie (1-year lifetime, matching
    //      the locale cookie) so repeat visits land on the right region.
    //   2) Forward the header on outbound "Talk to sales" submissions so
    //      the CRM lead lands in the right sales team's queue.
    //   3) Feed regional pricing into the pricing page once the backend
    //      exposes per-region catalogues.
    // eslint-disable-next-line no-console
    console.info("[footer] region selected:", next);

    setRegion(next);
  };

  return (
    <Dropdown>
      <button
        aria-label={t("regionSelector.aria")}
        className={[
          "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-muted transition-colors",
          "hover:bg-default/40 hover:text-foreground",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          className ?? "",
        ]
          .filter(Boolean)
          .join(" ")}
        type="button"
      >
        <GlobeAltIcon aria-hidden="true" className="size-4" />
        <span>{t(`regions.${region}`)}</span>
        <ChevronDownIcon aria-hidden="true" className="size-3.5 opacity-70" />
      </button>

      <Dropdown.Popover className="min-w-[180px]" placement={placement}>
        <Dropdown.Menu
          disallowEmptySelection
          aria-label={t("regionSelector.label")}
          selectedKeys={new Set([region])}
          selectionMode="single"
          onAction={handleAction}
        >
          {REGIONS.map((code) => (
            <Dropdown.Item key={code} id={code} textValue={code}>
              <Label>{t(`regions.${code}`)}</Label>
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
