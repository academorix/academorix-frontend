/**
 * @file use-back.hook.spec.tsx
 * @module @stackra/routing/__tests__/react
 * @description Unit tests for the back-navigation hook.
 */

// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";

import { StackraRoutingContext } from "@/react/contexts";
import type { IStackraRouter } from "@/react/contexts";
import { useBack } from "@/react/hooks/use-back";

function buildRouter(): {
  readonly router: IStackraRouter;
  readonly navigate: ReturnType<typeof vi.fn>;
} {
  const navigate = vi.fn();
  const router = { navigate } as unknown as IStackraRouter;
  return { router, navigate };
}

function makeWrapper(router: IStackraRouter): (props: { children: ReactNode }) => JSX.Element {
  return ({ children }) => (
    <StackraRoutingContext.Provider
      value={{
        // Bare minimum — the back hook only touches `router`.
        container: {} as never,
        config: {},
        router,
      }}
    >
      {children}
    </StackraRoutingContext.Provider>
  );
}

describe("useBack", () => {
  it("calls router.go(-1) when history is available", async () => {
    const { router, navigate } = buildRouter();
    // Simulate a history length > 1.
    Object.defineProperty(window, "history", {
      configurable: true,
      value: { length: 2 },
    });
    const { result } = renderHook(() => useBack(), { wrapper: makeWrapper(router) });
    await result.current();
    expect(navigate).toHaveBeenCalledWith(-1);
  });

  it("navigates to the fallback string when history is empty", async () => {
    const { router, navigate } = buildRouter();
    Object.defineProperty(window, "history", {
      configurable: true,
      value: { length: 1 },
    });
    const { result } = renderHook(() => useBack("/dashboard"), {
      wrapper: makeWrapper(router),
    });
    await result.current();
    expect(navigate).toHaveBeenCalledWith("/dashboard", expect.objectContaining({}));
  });

  it("honours numeric fallback offsets directly", async () => {
    const { router, navigate } = buildRouter();
    const { result } = renderHook(() => useBack(-2), { wrapper: makeWrapper(router) });
    await result.current();
    expect(navigate).toHaveBeenCalledWith(-2);
  });
});
