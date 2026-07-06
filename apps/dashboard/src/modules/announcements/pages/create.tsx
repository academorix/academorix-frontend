/**
 * @file create.tsx
 * @module modules/announcements/pages/create
 *
 * @description
 * Announcement create screen. `useForm` drives the mutation and redirects to
 * the list; the active scope supplies the branch on the payload.
 */

import { useForm } from "@refinedev/core";

import type { Announcement } from "@/modules/announcements/announcements.types";
import type { ReactNode } from "react";

import { CreateView } from "@/components/refine";
import { useScope } from "@/lib/scope";
import {
  AnnouncementForm,
  toAnnouncementPayload,
} from "@/modules/announcements/components/announcement-form";

/** The announcement create page. */
export default function AnnouncementCreate(): ReactNode {
  const { scope } = useScope();
  const { onFinish, formLoading } = useForm<Announcement>({
    resource: "announcements",
    action: "create",
    redirect: "list",
  });

  return (
    <CreateView resource="announcements">
      <AnnouncementForm
        isSubmitting={formLoading}
        submitLabel="Create announcement"
        onSubmit={(values) => {
          void onFinish(toAnnouncementPayload(values, scope.branchId));
        }}
      />
    </CreateView>
  );
}
