/**
 * @file use-stackra-routing-context.hook.spec.tsx
 * @module @stackra/routing/__tests__/react
 * @description Unit tests for the routing-context hook — verifies
 *   the "no provider" branch throws with the documented message.
 */

// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";

import { useStackraRoutingContext } from "@/react/hooks/use-stackra-routing-context";

describe("useStackraRoutingContext", () => {
  it("throws when called outside <StackraRoutingProvider>", () => {
    expect(() => renderHook(() => useStackraRoutingContext())).toThrow(
      /useStackraRoutingContext\(\) called outside <StackraRoutingProvider>/,
    );
  });
});
