/**
 * @file person-header.tsx
 * @module modules/people/components/person-header
 *
 * @description
 * The identity-header block reused on the People show page and inside the
 * merge screen (once on each side). Renders the person's avatar, display
 * name, primary contact rail, and a compact meta row (DOB + nationality +
 * languages). Kept dumb — every field is optional, so callers can pass a
 * partial Person shape during a merge preview.
 */

import type { Person } from "@/modules/people/people.types";
import type { ReactNode } from "react";

import { formatDate } from "@/lib/format";
import { PersonAvatar } from "@/modules/people/components/person-avatar";
import { EMPTY_PLACEHOLDER } from "@/modules/people/people.config";

/** Props for {@link PersonHeader}. */
export interface PersonHeaderProps {
  /** The person to render — may be a partial shape (e.g. merge preview). */
  person: Pick<
    Person,
    | "id"
    | "full_name"
    | "avatar_url"
    | "primary_email"
    | "primary_phone"
    | "dob"
    | "nationality"
    | "languages"
  >;
  /** Size of the header (drives the avatar and title scale). */
  size?: "sm" | "md";
  /** Slot for trailing actions (e.g. a "Merge" button on the show page). */
  actions?: ReactNode;
}

/**
 * Renders the identity header for a {@link Person}. Missing fields collapse
 * to the shared placeholder rather than emitting empty rows, so both the
 * show page and a merge preview render at the same height.
 *
 * @param props - The person, optional size, and trailing action nodes.
 */
export function PersonHeader({ person, size = "md", actions }: PersonHeaderProps): ReactNode {
  const languages = person.languages.length > 0 ? person.languages.join(", ") : EMPTY_PLACEHOLDER;
  const titleClass =
    size === "sm"
      ? "text-lg font-semibold text-foreground"
      : "text-xl font-semibold text-foreground";

  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-center gap-4">
        <PersonAvatar
          avatarUrl={person.avatar_url}
          name={person.full_name}
          size={size === "sm" ? "md" : "lg"}
        />

        <div className="flex min-w-0 flex-col gap-1">
          <h2 className={titleClass}>{person.full_name}</h2>
          <p className="text-xs text-muted">Academorix ID: {person.id}</p>
          <dl className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <div className="flex items-center gap-1.5">
              <dt className="text-muted">Email:</dt>
              <dd className="text-foreground">{person.primary_email ?? EMPTY_PLACEHOLDER}</dd>
            </div>
            <div className="flex items-center gap-1.5">
              <dt className="text-muted">Phone:</dt>
              <dd className="text-foreground">{person.primary_phone ?? EMPTY_PLACEHOLDER}</dd>
            </div>
            <div className="flex items-center gap-1.5">
              <dt className="text-muted">DOB:</dt>
              <dd className="text-foreground">{formatDate(person.dob)}</dd>
            </div>
            <div className="flex items-center gap-1.5">
              <dt className="text-muted">Nationality:</dt>
              <dd className="text-foreground">{person.nationality ?? EMPTY_PLACEHOLDER}</dd>
            </div>
            <div className="flex items-center gap-1.5">
              <dt className="text-muted">Languages:</dt>
              <dd className="text-foreground">{languages}</dd>
            </div>
          </dl>
        </div>
      </div>

      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </header>
  );
}
