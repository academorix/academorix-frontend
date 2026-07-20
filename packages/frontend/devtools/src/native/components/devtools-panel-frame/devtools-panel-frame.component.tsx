/**
 * @file devtools-panel-frame.component.tsx
 * @module @stackra/devtools/native/components
 * @description Wraps a single panel with a header + optional badge
 *   on native. Dispatches to {@link DevtoolsPanelView} for the
 *   body, or {@link DevtoolsPanelLocked} when the panel's
 *   `requireAuth` gate denies access.
 *
 *   The auth-gate resolution uses the same fail-open contract as
 *   the web version — a missing `AUTH_SERVICE` (native app that
 *   doesn't ship `@stackra/auth`) never denies access.
 */

import { useEffect, useMemo, type ReactElement } from "react";
import { Text, View } from "react-native";
import { Card, Chip } from "@stackra/ui/native";
import { useOptionalInject } from "@stackra/container/react";
import { AUTH_SERVICE, type IDevtoolsAuthGate } from "@stackra/contracts";

import { useNativeDevtoolsContext } from "../../hooks/use-native-devtools-context.hook";
import { DevtoolsPanelLocked } from "../devtools-panel-locked";
import { DevtoolsPanelView } from "../devtools-panel-view";
import type { DevtoolsPanelFrameProps } from "./devtools-panel-frame.interface";

/** Minimal shape we consume from the optional auth service. */
interface IAuthServiceLike {
  readonly isAuthenticated?: boolean | (() => boolean);
  readonly currentUser?: unknown;
  can?: (ability: string, resource?: unknown) => boolean;
}

/** Resolved gate state for the frame. */
type GateState =
  | { readonly allowed: true }
  | { readonly allowed: false; readonly reason: "unauthenticated" | "forbidden" };

/**
 * Resolve a panel's optional gate against the optional auth
 * service. Falls open when either is missing.
 */
function resolveGate(
  gate: IDevtoolsAuthGate | undefined,
  authService: IAuthServiceLike | undefined,
): GateState {
  if (!gate) return { allowed: true };
  if (!authService) return { allowed: true };
  const isAuthed =
    typeof authService.isAuthenticated === "function"
      ? authService.isAuthenticated()
      : Boolean(authService.isAuthenticated ?? authService.currentUser);
  if (!isAuthed) return { allowed: false, reason: "unauthenticated" };
  const can = authService.can?.(gate.ability, gate.resource) ?? false;
  return can ? { allowed: true } : { allowed: false, reason: "forbidden" };
}

/**
 * Renders the current panel with a header + gate + view.
 */
export function DevtoolsPanelFrame({ panel }: DevtoolsPanelFrameProps): ReactElement {
  const authService = useOptionalInject<IAuthServiceLike>(AUTH_SERVICE);
  const { analytics } = useNativeDevtoolsContext();

  // Emit `PANEL_ACTIVATED` once per activation (fresh mount).
  useEffect(() => {
    analytics.panelActivated(panel.id);
    if (panel.onActivate) {
      try {
        void panel.onActivate();
      } catch {
        // fail-soft — a broken activate hook must not stall the
        // shell.
      }
    }
    return () => {
      if (panel.onDeactivate) {
        try {
          panel.onDeactivate();
        } catch {
          // fail-soft
        }
      }
    };
  }, [panel, analytics]);

  const badge = useMemo(() => {
    if (!panel.badge) return null;
    try {
      const value = panel.badge();
      // `badge()` returns `string | number | null`; anything falsy
      // hides the chip so 0-count badges don't visually clutter
      // the header.
      if (value === null || value === undefined || value === 0 || value === "") {
        return null;
      }
      return String(value);
    } catch {
      // fail-soft — a broken badge must not hide the panel.
      return null;
    }
  }, [panel]);

  const gate = useMemo(
    () => resolveGate(panel.requireAuth, authService),
    [panel.requireAuth, authService],
  );

  return (
    <View className="flex-1">
      <Card>
        <Card.Header>
          <View className="flex-row items-center gap-2">
            <Card.Title>{panel.title}</Card.Title>
            {badge ? (
              <Chip size="sm" variant="secondary">
                <Chip.Label>{badge}</Chip.Label>
              </Chip>
            ) : null}
          </View>
        </Card.Header>
      </Card>
      <View className="flex-1">
        {gate.allowed ? (
          <DevtoolsPanelView panel={panel} />
        ) : panel.requireAuth ? (
          <DevtoolsPanelLocked gate={panel.requireAuth} reason={gate.reason} />
        ) : (
          <View className="p-4">
            <Text className="text-muted text-sm">Panel unavailable.</Text>
          </View>
        )}
      </View>
    </View>
  );
}
