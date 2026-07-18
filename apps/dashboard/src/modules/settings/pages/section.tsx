/**
 * @file section.tsx
 * @module modules/settings/pages/section
 *
 * @description
 * The single generic settings page (`/settings/:sectionId`). Reads the
 * section id from the URL, fetches every setting for that section from the
 * `settings-schema` fixture via Refine, groups the fields by `group`, and
 * renders each one through `<SettingFieldRenderer>`. Adding a new tab is a
 * matter of editing the JSON schema — no per-page code is needed.
 */

import { Spinner } from "@heroui/react";
import { EmptyState } from "@heroui-pro/react";
import { Navigate, useParams } from "@stackra/routing/react";

import { Iconify } from "@/icons/iconify";
import { ScopeSwitcher } from "@/modules/settings/components/scope-switcher";
import { SettingFieldRenderer } from "@/modules/settings/components/setting-field";
import { useSettingsScope } from "@/modules/settings/scope/settings-provider";
import { SettingsPageShell } from "@/modules/settings/pages/settings-page-shell";
import { findSection } from "@/modules/settings/settings.sections";

export default function SettingsSectionPage() {
  const { sectionId } = useParams<{ sectionId: string }>();
  const { fields, fieldsForSection, isLoading } = useSettingsScope();

  // Redirect the bare `/settings` URL to General.
  if (!sectionId) return <Navigate replace to="/settings/general" />;

  const section = findSection(sectionId);

  // Unknown section → 404-lite empty state, still inside the settings shell.
  if (!section) {
    return (
      <SettingsPageShell>
        <EmptyState className="py-16">
          <EmptyState.Header>
            <EmptyState.Media variant="icon">
              <Iconify icon="circle-question" />
            </EmptyState.Media>
            <EmptyState.Title>Unknown settings section</EmptyState.Title>
            <EmptyState.Description>
              The section id <code>{sectionId}</code> isn't declared in the settings catalogue.
            </EmptyState.Description>
          </EmptyState.Header>
        </EmptyState>
      </SettingsPageShell>
    );
  }

  const sectionFields = fieldsForSection(sectionId);
  const grouped = groupByGroup(sectionFields);

  if (isLoading && fields.length === 0) {
    return (
      <SettingsPageShell>
        <div className="flex items-center justify-center py-16">
          <Spinner color="accent" size="lg" />
        </div>
      </SettingsPageShell>
    );
  }

  if (sectionFields.length === 0) {
    return (
      <SettingsPageShell>
        <div className="flex flex-col gap-4">
          <ScopeSwitcher />
          <EmptyState className="py-12">
            <EmptyState.Header>
              <EmptyState.Media variant="icon">
                {/*
                  Settings section descriptors ship a heroicons
                  component (`IconType`), not an Iconify token —
                  render it directly rather than through Iconify.
                */}
                <section.icon aria-hidden="true" className="size-6" />
              </EmptyState.Media>
              <EmptyState.Title>{section.label}</EmptyState.Title>
              <EmptyState.Description>
                No fields are declared for this section yet. Add entries to{" "}
                <code>src/refine/data/settings-schema.json</code> and they'll appear here.
              </EmptyState.Description>
            </EmptyState.Header>
          </EmptyState>
        </div>
      </SettingsPageShell>
    );
  }

  return (
    <SettingsPageShell>
      <div className="flex flex-col gap-6">
        <ScopeSwitcher />

        <div className="flex flex-col gap-6">
          {grouped.map(({ group, items }) => (
            <section key={group ?? "default"} className="flex flex-col gap-3">
              {group ? (
                <h3 className="text-sm font-semibold tracking-tight text-foreground">{group}</h3>
              ) : null}
              <div className="flex flex-col gap-2">
                {items.map((field) => (
                  <SettingFieldRenderer key={field.key} field={field} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </SettingsPageShell>
  );
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

type Grouped<T> = { group: string | null; items: T[] };

function groupByGroup<T extends { group?: string }>(items: T[]): Grouped<T>[] {
  const map = new Map<string | null, T[]>();

  for (const item of items) {
    const key = item.group ?? null;
    const list = map.get(key) ?? [];

    list.push(item);
    map.set(key, list);
  }

  return Array.from(map.entries()).map(([group, groupItems]) => ({ group, items: groupItems }));
}
