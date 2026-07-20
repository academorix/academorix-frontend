/**
 * @file devtools-panel-locked.component.tsx
 * @module @stackra/devtools/native/components
 * @description The locked-panel screen on native — rendered inside
 *   the panel viewport when the panel's `requireAuth` gate denies
 *   access.
 *
 *   Mirrors the web version: an icon slot ("lock"), the gate
 *   message, and (when `@stackra/auth`'s `AUTH_SERVICE` is
 *   present) a "Sign in" button on the `'unauthenticated'` path.
 */

import { type ReactElement } from "react";
import { Text, View } from "react-native";
import { Button, Card } from "@stackra/ui/native";
import { useOptionalInject } from "@stackra/container/react";
import { AUTH_SERVICE } from "@stackra/contracts";

import type {
  DevtoolsPanelLockedProps,
  DevtoolsAuthDenyReason,
} from "./devtools-panel-locked.interface";

/** Fallback copy for each deny reason. */
const DEFAULT_MESSAGES: Record<DevtoolsAuthDenyReason, { title: string; description: string }> = {
  unauthenticated: {
    title: "Sign in required",
    description:
      "This panel is gated. Sign in with an account that has access to view its contents.",
  },
  forbidden: {
    title: "You don't have permission",
    description:
      "This panel is gated behind an ability your current account doesn't have. Contact an admin if you believe this is a mistake.",
  },
};

/**
 * The native locked-panel screen.
 */
export function DevtoolsPanelLocked({ gate, reason }: DevtoolsPanelLockedProps): ReactElement {
  // The Sign-in affordance is offered only when we can see an
  // auth service in the container — otherwise there's no
  // meaningful action to bind the button to.
  const authService = useOptionalInject<{ signIn?: () => void }>(AUTH_SERVICE);
  const canOfferSignIn = reason === "unauthenticated" && Boolean(authService);

  const defaults = DEFAULT_MESSAGES[reason];
  const description = gate.message ?? defaults.description;

  return (
    <View className="flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <Card.Header>
          <View className="flex-row items-center gap-2">
            {/* Native has no @heroicons/react — render the lock as
                a Unicode glyph to keep the icon slot cross-
                platform without a new dep. */}
            <Text className="text-warning text-lg" accessibilityLabel="Locked">
              🔒
            </Text>
            <Card.Title>{defaults.title}</Card.Title>
          </View>
        </Card.Header>
        <Card.Body>
          <Text className="text-muted text-sm">{description}</Text>
          <View className="bg-surface-secondary mt-3 rounded-md p-3">
            <Text className="text-muted text-xs">
              Required ability: {gate.ability}
              {gate.resource ? ` · resource ${String(gate.resource)}` : null}
            </Text>
          </View>
        </Card.Body>
        {canOfferSignIn ? (
          <Card.Footer>
            <Button
              size="sm"
              variant="primary"
              onPress={() => {
                // Fail-soft — some auth services expose a
                // navigation callback, others require a router
                // hop. When the service doesn't ship a `signIn`
                // helper, this is a no-op.
                try {
                  authService?.signIn?.();
                } catch {
                  // fail-soft — see docblock.
                }
              }}
            >
              <Button.Label>Sign in</Button.Label>
            </Button>
          </Card.Footer>
        ) : null}
      </Card>
    </View>
  );
}
