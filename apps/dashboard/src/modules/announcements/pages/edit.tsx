/**
 * @file edit.tsx
 * @module modules/announcements/pages/edit
 *
 * @description
 * Announcement edit screen. Renders the shared form once the record has loaded.
 */

import { Spinner } from "@stackra/ui/react";
import { useForm } from "@refinedev/core";

import type { Announcement } from "@/modules/announcements/announcements.types";
import type { ReactNode } from "react";

import { EditView } from "@/components/refine";
import { useScope } from "@/lib/scope";
import {
  AnnouncementForm,
  toAnnouncementPayload,
} from "@/modules/announcements/components/announcement-form";

/** The announcement edit page. */
export default function AnnouncementEdit(): ReactNode {
  const { scope } = useScope();
  const { query, onFinish, formLoading } = useForm<Announcement>({
    resource: "announcements",
    action: "edit",
    redirect: "list",
  });

  const record = query?.data?.data;

  return (
    <EditView resource="announcements">
      {record ? (
        <AnnouncementForm
          initialValues={record}
          isSubmitting={formLoading}
          submitLabel="Save changes"
          onSubmit={(values) => {
            void onFinish(toAnnouncementPayload(values, scope.branchId));
          }}
        />
      ) : (
        <div className="flex h-40 items-center justify-center">
          <Spinner aria-label="Loading" />
        </div>
      )}
    </EditView>
  );
}
