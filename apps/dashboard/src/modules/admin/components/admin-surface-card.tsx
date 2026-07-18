/**
 * @file admin-surface-card.tsx
 * @module modules/admin/components/admin-surface-card
 *
 * @description
 * The card rendered on the Admin Console hub for a single {@link AdminSurface}.
 * Shows the surface icon, title, description, and a primary "Open" action that
 * navigates to the surface's path. When a surface is `isComingSoon`, the
 * action is replaced with a disabled "Coming soon" button so operators still
 * see the entry but understand it is not yet live.
 *
 * Navigation is performed with `react-router`'s `useNavigate` (rather than a
 * plain `<Link>` inside a `<Button>`) so the button keeps its native button
 * semantics — matches the pattern used by the notification empty state and
 * subscription banner elsewhere in the shell.
 */

import { ArrowRightIcon, ArrowTopRightOnSquareIcon } from "@stackra/ui/icons/heroicon/outline";
import { Button, Card, Chip } from "@stackra/ui/react";
import { useNavigate } from "@stackra/routing/react";

import type { AdminSurface } from "@/modules/admin/admin.types";
import type { ReactNode } from "react";

/** Props for {@link AdminSurfaceCard}. */
export interface AdminSurfaceCardProps {
  /** The surface descriptor to render. */
  surface: AdminSurface;
}

/**
 * A hub card for a single admin surface.
 *
 * @param props - The surface to render.
 */
export function AdminSurfaceCard({ surface }: AdminSurfaceCardProps): ReactNode {
  const navigate = useNavigate();
  // Cache the icon component to a capitalized local so JSX can render it —
  // Heroicons ship as `forwardRef` objects which JSX cannot spread.
  const Icon = surface.icon;
  const ActionIcon = surface.isExternal ? ArrowTopRightOnSquareIcon : ArrowRightIcon;

  const handleOpen = (): void => {
    // The card is rendered non-interactively when `isComingSoon`; guard the
    // handler anyway so a stale press cannot fire mid-transition.
    if (surface.isComingSoon) {
      return;
    }

    navigate(surface.path);
  };

  return (
    <Card
      // The card acts as a semantic grouping; the interactive affordance is
      // the button in its footer so keyboard users can Tab straight to it.
      aria-labelledby={`admin-surface-${surface.id}-title`}
      className="flex h-full flex-col"
    >
      <Card.Header className="gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <Icon aria-hidden="true" className="size-5" />
        </div>
        <div className="flex flex-col gap-1">
          <Card.Title id={`admin-surface-${surface.id}-title`}>{surface.title}</Card.Title>
          <Card.Description>{surface.description}</Card.Description>
        </div>
      </Card.Header>

      <Card.Footer className="mt-auto items-center justify-between gap-2 pt-4">
        {/* Surface-status pill — makes external / coming-soon states visible
            without changing the primary button copy. */}
        {surface.isComingSoon ? (
          <Chip color="warning" size="sm" variant="soft">
            Coming soon
          </Chip>
        ) : surface.isExternal ? (
          <Chip size="sm" variant="secondary">
            External
          </Chip>
        ) : (
          <span aria-hidden="true" />
        )}

        <Button
          aria-label={
            surface.isComingSoon ? `${surface.title} — coming soon` : `Open ${surface.title}`
          }
          isDisabled={surface.isComingSoon}
          size="sm"
          variant={surface.isComingSoon ? "ghost" : "secondary"}
          onPress={handleOpen}
        >
          {surface.isComingSoon ? "Coming soon" : "Open"}
          {!surface.isComingSoon ? <ActionIcon aria-hidden="true" className="size-4" /> : null}
        </Button>
      </Card.Footer>
    </Card>
  );
}
