/**
 * @file use-navigate.hook.spec.tsx
 * @module @stackra/routing/__tests__/react
 * @description Unit tests for the navigate hook.
 */

// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";

import { StackraRoutingContext } from "@/react/contexts";
import type { IStackraRouter } from "@/react/contexts";
import { useNavigate } from "@/react/hooks/use-navigate";

describe("useNavigate", () => {
  it("dispatches through router.navigate with the correct opts", async () => {
    const navigate = vi.fn();
    const router = { navigate } as unknown as IStackraRouter;
    const wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
      <StackraRoutingContext.Provider value={{ container: {} as never, config: {}, router }}>
        {children}
      </StackraRoutingContext.Provider>
    );
    const { result } = renderHook(() => useNavigate(), { wrapper });
    await result.current("/dashboard", { replace: true });
    expect(navigate).toHaveBeenCalledWith("/dashboard", expect.objectContaining({ replace: true }));
  });

  it("throws outside <StackraRoutingProvider>", () => {
    expect(() => renderHook(() => useNavigate())).toThrow(
      /useStackraRoutingContext\(\) called outside <StackraRoutingProvider>/,
    );
  });
});
