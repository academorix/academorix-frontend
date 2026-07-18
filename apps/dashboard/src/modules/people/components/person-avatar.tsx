/**
 * @file person-avatar.tsx
 * @module modules/people/components/person-avatar
 *
 * @description
 * A person-shaped avatar tile — renders the person's uploaded photo when
 * available, and falls back to their initials otherwise. Used by the list
 * grid, the identity header, and the merge selector so a photo missing on
 * one screen matches the same fallback everywhere.
 */

import { Avatar } from "@stackra/ui/react";

import type { ReactNode } from "react";

import { initialsFromName } from "@/modules/people/people.config";

/** Props for {@link PersonAvatar}. */
export interface PersonAvatarProps {
  /** Person display name (drives the fallback and the image `alt`). */
  name: string | null | undefined;
  /** Optional photo URL. When null/undefined the fallback initials render. */
  avatarUrl?: string | null;
  /** Avatar size — defaults to `"md"` to match the rest of the app. */
  size?: "sm" | "md" | "lg";
  /** Extra classes to layer over the base avatar (e.g. ring/hover styles). */
  className?: string;
}

/**
 * Renders an avatar for a {@link Person}. When `avatarUrl` is empty the
 * component displays the person's initials via {@link initialsFromName}.
 *
 * @param props - Name, photo URL, size, and optional className.
 */
export function PersonAvatar({
  name,
  avatarUrl,
  size = "md",
  className,
}: PersonAvatarProps): ReactNode {
  const initials = initialsFromName(name);
  const altText = name ?? "Person";

  return (
    <Avatar className={className} size={size}>
      {avatarUrl ? <Avatar.Image alt={altText} src={avatarUrl} /> : null}
      <Avatar.Fallback>{initials}</Avatar.Fallback>
    </Avatar>
  );
}
