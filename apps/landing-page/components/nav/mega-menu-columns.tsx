/**
 * @file mega-menu-columns.tsx
 * @module components/nav/mega-menu-columns
 *
 * @description
 * Small link columns inside a mega-menu panel.
 */

import { Chip } from "@academorix/ui/react";

import type { MegaLink, MegaMenuColumn } from "@/lib/types";
import type { ReactNode } from "react";

import { Link } from "@/i18n/navigation";
import { isExternalHref } from "@/lib/marketing/cta";

/** Renders a single link inside a column. */
function MegaLinkItem({ link }: { link: MegaLink }): ReactNode {
  const className =
    "flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground";

  const content = (
    <>
      {link.label}
      {link.badge ? (
        <Chip color="accent" size="sm" variant="soft">
          <Chip.Label>{link.badge}</Chip.Label>
        </Chip>
      ) : null}
    </>
  );

  if (isExternalHref(link.href)) {
    return (
      <a className={className} href={link.href} rel="noopener noreferrer" target="_blank">
        {content}
      </a>
    );
  }

  return (
    <Link className={className} href={link.href}>
      {content}
    </Link>
  );
}

/** Renders the small-link columns section of a mega-menu panel. */
export function MegaMenuColumns({ columns }: { columns: readonly MegaMenuColumn[] }): ReactNode {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
      {columns.map((column) => (
        <nav key={column.title} aria-label={column.title} className="flex flex-col gap-3">
          <h3 className="text-xs font-semibold tracking-wide text-foreground uppercase">
            {column.title}
          </h3>
          <ul className="flex flex-col gap-2.5">
            {column.links.map((link) => (
              <li key={link.label}>
                <MegaLinkItem link={link} />
              </li>
            ))}
          </ul>
        </nav>
      ))}
    </div>
  );
}
