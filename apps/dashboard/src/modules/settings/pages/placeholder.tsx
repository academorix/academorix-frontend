/**
 * @file placeholder.tsx
 * @module modules/settings/pages/placeholder
 *
 * @description
 * A tiny factory that produces a lazy-loadable page component bound to a
 * specific section id. Every not-yet-implemented section in Phase 4a routes
 * through this factory so the module manifest stays declarative and the
 * "Coming soon" state is the default until Phase 4b flips the section's
 * `isAvailable` flag.
 */

import type { SettingsSectionId } from "@/modules/settings/settings.types";
import type { ReactNode } from "react";

import { SectionPage } from "@/modules/settings/pages/section-page";

/** Returns a page component that renders the given section id. */
export function createPlaceholderPage(sectionId: SettingsSectionId): () => ReactNode {
  const PlaceholderPage = function PlaceholderPage(): ReactNode {
    return <SectionPage sectionId={sectionId} />;
  };

  return PlaceholderPage;
}
