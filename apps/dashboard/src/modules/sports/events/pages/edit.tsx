/**
 * @file edit.tsx
 * @module modules/sports/events/pages/edit
 *
 * @description
 * Event edit screen. Renders the shared form once the record has loaded.
 */

import { Spinner } from "@stackra/ui/react";
import { useForm } from "@refinedev/core";

import type { Event } from "@/types";
import type { ReactNode } from "react";

import { EditView } from "@/components/refine";
import { EventForm, toEventPayload } from "@/modules/sports/events/components/event-form";

/** The event edit page. */
export default function EventEdit(): ReactNode {
  const { query, onFinish, formLoading } = useForm<Event>({
    resource: "events",
    action: "edit",
    redirect: "list",
  });

  const record = query?.data?.data;

  return (
    <EditView resource="events">
      {record ? (
        <EventForm
          initialValues={record}
          isSubmitting={formLoading}
          submitLabel="Save changes"
          onSubmit={(values) => {
            void onFinish(toEventPayload(values));
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
