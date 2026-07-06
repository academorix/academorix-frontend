/**
 * @file settings-header.tsx
 * @module modules/settings/layout/settings-header
 *
 * @description
 * The header rendered at the top of every settings section. Shows a
 * breadcrumb trail (Settings → <section>) plus the section title, description,
 * and an optional right-aligned actions slot for section-scoped verbs (Save,
 * Reset, Publish).
 *
 * Pairs with {@link SettingsLayout}: the header sits at the top of the main
 * column, above the section content.
 */

import { ChevronRightIcon } from "@academorix/ui/icons/outline";
import { Link } from "@academorix/ui/react";

import type { ReactNode } from "react";

/** Props for {@link SettingsHeader}. */
export interface SettingsHeaderProps {
  /** Section title, e.g. `"General"`. */
  title: string;
  /** Short subtitle rendered beneath the title. */
  description?: string;
  /** Right-aligned actions (save button, help link, etc.). */
  actions?: ReactNode;
}

/** Renders the section header row. */
export function SettingsHeader({ title, description, actions }: SettingsHeaderProps): ReactNode {
  return (
    <header className="flex flex-col gap-3 border-b border-border pb-4">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted">
        <Link className="text-muted hover:text-foreground" href="/settings">
          Settings
        </Link>
        <ChevronRightIcon aria-hidden="true" className="size-3" />
        <span className="text-foreground">{title}</span>
      </nav>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="truncate text-2xl font-semibold text-foreground">{title}</h1>
          {description ? <p className="text-sm text-muted">{description}</p> : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
