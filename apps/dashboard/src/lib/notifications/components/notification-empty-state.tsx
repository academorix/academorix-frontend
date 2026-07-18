/**
 * @file notification-empty-state.tsx
 * @module notifications/components/notification-empty-state
 *
 * @description
 * The "you're all caught up 🎉" empty state, rendered when the drawer's
 * current section has no entries after filters. Links out to the
 * preferences page so a user who finds themselves here often can tune
 * their signal-to-noise ratio.
 *
 * ## Why a dedicated component
 *
 * The drawer, the full-page inbox route, and the (future) mobile sheet
 * all render an empty state — factoring it here keeps the copy + link
 * consistent regardless of which surface is showing it.
 */

import { BellSlashIcon, Cog6ToothIcon } from "@stackra/ui/icons/heroicon/outline";
import { Button, EmptyState } from "@stackra/ui/react";
import { useNavigate } from "@stackra/routing/react";

import type { ReactNode } from "react";

/** Props for {@link NotificationEmptyState}. */
export interface NotificationEmptyStateProps {
  /**
   * Whether the empty state is being rendered inside the drawer
   * (bounded width) or a page (full width). Drives the internal
   * `EmptyState size` prop.
   */
  readonly variant?: "drawer" | "page";

  /**
   * Called when the user presses "Notification preferences". The
   * default drawer surface passes a `close()` here so the drawer
   * closes before we navigate — otherwise the preferences page
   * mounts under a blurred backdrop.
   */
  readonly onNavigate?: () => void;
}

/**
 * The "nothing here" panel for the inbox. Uses HeroUI Pro's
 * `EmptyState` with a bell icon + call-to-action into the preferences
 * page. We drive navigation through `useNavigate` (not a `Link`)
 * because HeroUI's `Button` swallows anchor semantics and using its
 * `render` prop to shim a Link would require rebuilding the whole
 * button internal tree.
 */
export function NotificationEmptyState({
  variant = "drawer",
  onNavigate,
}: NotificationEmptyStateProps): ReactNode {
  const navigate = useNavigate();

  const handlePress = (): void => {
    onNavigate?.();
    void navigate("/notifications/preferences");
  };

  return (
    <EmptyState size={variant === "page" ? "lg" : "md"}>
      <EmptyState.Header>
        <EmptyState.Media variant="icon">
          <BellSlashIcon aria-hidden="true" className="size-5" />
        </EmptyState.Media>
        <EmptyState.Title>You&apos;re all caught up</EmptyState.Title>
        <EmptyState.Description>
          New notifications will appear here. Tune what you get from the preferences page.
        </EmptyState.Description>
      </EmptyState.Header>
      <EmptyState.Content>
        <Button size="sm" variant="outline" onPress={handlePress}>
          <Cog6ToothIcon aria-hidden="true" className="size-4" />
          Notification preferences
        </Button>
      </EmptyState.Content>
    </EmptyState>
  );
}
