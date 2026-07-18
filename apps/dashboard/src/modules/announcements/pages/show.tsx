/**
 * @file show.tsx
 * @module modules/announcements/pages/show
 *
 * @description
 * Announcement detail — audience, status, publish date, and the message body.
 */

import { Card, Chip, Spinner } from "@stackra/ui/react";
import { useShow } from "@refinedev/core";

import type { Announcement } from "@/modules/announcements/announcements.types";
import type { ReactNode } from "react";

import { ShowView } from "@/components/refine";
import { formatDate } from "@/lib/format";

/** A single labelled detail field. */
function Field({ label, children }: { label: string; children: ReactNode }): ReactNode {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-medium tracking-wide text-muted uppercase">{label}</dt>
      <dd className="text-sm text-foreground">{children}</dd>
    </div>
  );
}

/** The announcement detail page. */
export default function AnnouncementShow(): ReactNode {
  const { result: announcement, query } = useShow<Announcement>({ resource: "announcements" });

  return (
    <ShowView resource="announcements">
      {query.isLoading || !announcement ? (
        <div className="flex h-40 items-center justify-center">
          <Spinner aria-label="Loading" />
        </div>
      ) : (
        <Card>
          <Card.Header>
            <Card.Title>{announcement.title}</Card.Title>
            <Card.Description>Announcement</Card.Description>
          </Card.Header>
          <Card.Content>
            <div className="flex flex-col gap-4">
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label="Audience">{announcement.audience}</Field>
                <Field label="Status">
                  {announcement.status === "published" ? (
                    <Chip color="success" size="sm" variant="soft">
                      Published
                    </Chip>
                  ) : (
                    <Chip size="sm" variant="soft">
                      Draft
                    </Chip>
                  )}
                </Field>
                <Field label="Published">{formatDate(announcement.published_at)}</Field>
              </dl>
              <p className="text-sm whitespace-pre-wrap text-foreground">{announcement.body}</p>
            </div>
          </Card.Content>
        </Card>
      )}
    </ShowView>
  );
}
