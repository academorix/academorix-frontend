import { Chip } from "@heroui/react";
import { EmptyState } from "@heroui-pro/react";

import { Iconify } from "../icons/iconify";
import { PageHeader } from "./page-header";

type PlaceholderPageProps = {
  description?: string;
  icon?: string;
  note?: string;
  title: string;
};

export function PlaceholderPage({
  description,
  icon = "sparkles",
  note = "This module is scaffolded and ready. Connect its data provider and screens to bring it online.",
  title,
}: PlaceholderPageProps) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        actions={
          <Chip color="warning" size="sm" variant="soft">
            Coming soon
          </Chip>
        }
        description={description}
        title={title}
      />
      <EmptyState className="rounded-xl border border-border bg-surface/60 py-16">
        <EmptyState.Header>
          <EmptyState.Media variant="icon">
            <Iconify icon={icon} />
          </EmptyState.Media>
          <EmptyState.Title>{title} workspace</EmptyState.Title>
          <EmptyState.Description>{note}</EmptyState.Description>
        </EmptyState.Header>
      </EmptyState>
    </div>
  );
}
