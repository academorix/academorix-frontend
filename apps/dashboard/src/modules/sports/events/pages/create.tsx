/**
 * @file create.tsx
 * @module modules/sports/events/pages/create
 *
 * @description
 * Event create screen. `useForm` drives the mutation and redirects to the list.
 */

import { useForm } from "@refinedev/core";

import type { Event } from "@/types";
import type { ReactNode } from "react";

import { CreateView } from "@/components/refine";
import { EventForm, toEventPayload } from "@/modules/sports/events/components/event-form";

/** The event create page. */
export default function EventCreate(): ReactNode {
  const { onFinish, formLoading } = useForm<Event>({
    resource: "events",
    action: "create",
    redirect: "list",
  });

  return (
    <CreateView resource="events">
      <EventForm
        isSubmitting={formLoading}
        submitLabel="Create event"
        onSubmit={(values) => {
          void onFinish(toEventPayload(values));
        }}
      />
    </CreateView>
  );
}
