/**
 * @file settings-layout.tsx
 * @module modules/settings/layout/settings-layout
 *
 * @description
 * The Settings module's inner layout. Every section page wraps its content in
 * this component so the secondary sidebar renders once per route and the
 * section header sits above the section body in a consistent shape.
 *
 * The layout is a two-column grid on desktop (secondary sidebar + section
 * content) that collapses to a stacked layout on narrow viewports. When we
 * layer a mobile-friendly Segment or Sheet in Phase 4b, the wrapper stays
 * the same shape; only the sidebar rendering shifts.
 */

import type { ReactNode } from "react";

import { SettingsSidebar } from "@/modules/settings/layout/settings-sidebar";

/** Props for {@link SettingsLayout}. */
export interface SettingsLayoutProps {
  /** The section content — usually a `<SectionContainer>`-flavoured page. */
  children: ReactNode;
}

/**
 * Wraps a settings section in the secondary sidebar + content shell. The
 * outer `min-h-full` keeps the sidebar spanning the full authenticated shell
 * height, so groups near the bottom (Advanced, Danger) stay reachable
 * regardless of scroll position.
 */
export function SettingsLayout({ children }: SettingsLayoutProps): ReactNode {
  return (
    <div className="grid min-h-full grid-cols-1 gap-0 lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="hidden lg:block">
        <SettingsSidebar />
      </aside>
      <main className="flex min-w-0 flex-col overflow-y-auto p-6">{children}</main>
    </div>
  );
}
