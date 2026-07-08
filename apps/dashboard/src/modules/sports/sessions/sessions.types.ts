/**
 * @file sessions.types.ts
 * @module modules/sports/sessions/sessions.types
 *
 * @description
 * Sessions-module-local type shapes. Wraps the shared domain {@link Event}
 * type from `@/types` with a `Session` alias that the calendar-driven pages
 * (attendance agenda, upcoming events widget) use in coach-facing copy.
 *
 * Keeping this alias inside the sessions module (rather than in `@/types`)
 * matches the folder ownership described in `attendance.module.tsx`: the
 * "session" vocabulary is a scheduling concern, not a shared platform type,
 * so it lives next to the pages that render it.
 */

import type { Event } from "@/types";

/**
 * A scheduled activity coaches and athletes attend — the coach-facing name
 * for the domain {@link Event}. Aliased rather than duplicated so a change
 * to the wire shape only touches one place.
 *
 * The `event` type on {@link Event} discriminates between training, match,
 * private session, and generic session — the alias covers every subtype so
 * the calendar can render them all with the same shape.
 */
export type Session = Event;
