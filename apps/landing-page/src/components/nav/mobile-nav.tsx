/**
 * @file mobile-nav.tsx
 * @module components/nav/mobile-nav
 *
 * @description
 * Full-viewport mobile navigation panel. Consumes the same `NavData` the
 * desktop header uses, so both surfaces stay in lockstep.
 */

"use client";

import { ChevronDownIcon } from "@academorix/ui/icons/outline";
import { Accordion, Button } from "@academorix/ui/react";
import { useEffect } from "react";

import type { MegaMenuPanel, NavData } from "@/lib/types";
import type { ReactNode } from "react";

import { MegaMenuBannerItem } from "@/components/nav/mega-menu-banner";
import { MegaMenuColumns } from "@/components/nav/mega-menu-columns";
import { MegaMenuFeatureCardItem } from "@/components/nav/mega-menu-feature-card";
import { Link } from "@/i18n/navigation";

/** Props for {@link MobileNav}. */
interface MobileNavProps {
  isOpen: boolean;
  nav: NavData;
  onClose: () => void;
  onSignIn: () => void;
}

/** Renders a mega-menu panel's contents inline (used inside the mobile drawer). */
function InlinePanel({ panel }: { panel: MegaMenuPanel }): ReactNode {
  return (
    <div className="flex flex-col gap-3 pb-2">
      {panel.columns ? <MegaMenuColumns columns={panel.columns} /> : null}
      {panel.feature_cards ? (
        <div className="flex flex-col gap-1">
          {panel.feature_cards.map((card) => (
            <MegaMenuFeatureCardItem key={card.href} card={card} />
          ))}
        </div>
      ) : null}
      {panel.banner ? <MegaMenuBannerItem banner={panel.banner} /> : null}
    </div>
  );
}

/** The mobile navigation panel. */
export function MobileNav({ isOpen, nav, onClose, onSignIn }: MobileNavProps): ReactNode {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previous = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      aria-label="Mobile navigation"
      aria-modal="true"
      className="fixed inset-x-0 top-16 bottom-0 z-30 overflow-y-auto border-t border-default bg-background lg:hidden"
      id="landing-mobile-nav"
      role="dialog"
    >
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-2 px-4 py-4 sm:px-6">
        <Accordion className="w-full">
          {nav.map((entry) => {
            if (entry.kind === "link") {
              return (
                <div key={entry.label} className="border-b border-default">
                  <Link
                    className="flex items-center py-4 text-sm font-medium text-foreground"
                    href={entry.href}
                    onClick={onClose}
                  >
                    {entry.label}
                  </Link>
                </div>
              );
            }

            return (
              <Accordion.Item key={entry.label} id={entry.label.toLowerCase()}>
                <Accordion.Heading>
                  <Accordion.Trigger className="py-4 text-sm font-medium text-foreground">
                    {entry.label}
                    <Accordion.Indicator>
                      <ChevronDownIcon aria-hidden="true" className="size-4 text-muted" />
                    </Accordion.Indicator>
                  </Accordion.Trigger>
                </Accordion.Heading>
                <Accordion.Panel>
                  <Accordion.Body className="pb-4">
                    <InlinePanel panel={entry.panel} />
                  </Accordion.Body>
                </Accordion.Panel>
              </Accordion.Item>
            );
          })}
        </Accordion>

        <div className="mt-6">
          <Button
            className="w-full rounded-full"
            size="lg"
            variant="primary"
            onPress={() => {
              onClose();
              onSignIn();
            }}
          >
            Sign in
          </Button>
        </div>
      </div>
    </div>
  );
}
