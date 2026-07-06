/**
 * @file section-page.tsx
 * @module modules/settings/pages/section-page
 *
 * @description
 * A single-file section renderer used by every one of the sixteen Settings
 * routes in Phase 4a. The page reads its descriptor from the section
 * catalogue and renders the standard `SettingsLayout` + `SettingsHeader` +
 * a body that either shows the section-specific form (once it lands in Phase
 * 4b) or a "Coming soon" placeholder.
 *
 * Keeping one page component instead of sixteen thin wrappers means adding a
 * new section is a two-file change: add a descriptor to
 * `settings.sections.ts`, add a route pointing here in the module manifest.
 */

import { WrenchScrewdriverIcon } from "@academorix/ui/icons/outline";
import { EmptyState } from "@academorix/ui/react";

import type { SettingsSectionId } from "@/modules/settings/settings.types";
import type { ReactNode } from "react";

import { NotFoundPage } from "@/components/not-found";
import { SettingsHeader } from "@/modules/settings/layout/settings-header";
import { SettingsLayout } from "@/modules/settings/layout/settings-layout";
import { settingsSectionsById } from "@/modules/settings/settings.sections";

/** Props for {@link SectionPage}. */
export interface SectionPageProps {
  /** The section this route renders. */
  sectionId: SettingsSectionId;
  /**
   * Optional custom body. Sections that have shipped their form (Phase 4b)
   * pass their content here; sections without content render a "Coming soon"
   * placeholder inside the standard shell.
   */
  children?: ReactNode;
}

/**
 * Renders a settings section. Unknown section ids fall through to a 404 so a
 * bad link cannot escape the shell.
 */
export function SectionPage({ sectionId, children }: SectionPageProps): ReactNode {
  const descriptor = settingsSectionsById.get(sectionId);

  if (!descriptor) {
    return <NotFoundPage />;
  }

  return (
    <SettingsLayout>
      <SettingsHeader description={descriptor.description} title={descriptor.label} />
      <div className="flex flex-col gap-6 pt-6">
        {children ?? (
          <EmptyState size="sm">
            <EmptyState.Header>
              <EmptyState.Media variant="icon">
                <WrenchScrewdriverIcon />
              </EmptyState.Media>
              <EmptyState.Title>Coming soon</EmptyState.Title>
              <EmptyState.Description>
                {descriptor.label} lands in a follow-up wave. The route and sidebar entry are
                registered so you can bookmark the section today.
              </EmptyState.Description>
            </EmptyState.Header>
          </EmptyState>
        )}
      </div>
    </SettingsLayout>
  );
}
