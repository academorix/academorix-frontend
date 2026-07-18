// @vitest-environment jsdom
/**
 * @file use-page-progress.spec.tsx
 * @module @stackra/ui/__tests__/unit
 * @description Behavioural spec for `usePageProgress` — verifies the
 *   guard error thrown when called outside `<PageProgressProvider>` and
 *   the happy path inside a provider (context wiring covered
 *   separately in `page-progress.spec.tsx`).
 */

import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import React from "react";

import { PageProgressProvider } from "@/react/providers/page-progress/page-progress.provider";
import { usePageProgress } from "@/react/hooks/use-page-progress/use-page-progress.hook";

afterEach(cleanup);

describe("usePageProgress", () => {
  it("throws a descriptive error when called outside a PageProgressProvider", () => {
    expect(() => renderHook(() => usePageProgress())).toThrow(
      /must be used within a <PageProgressProvider>/,
    );
  });

  it("returns the context value inside a PageProgressProvider", () => {
    const wrapper = ({ children }: { children: React.ReactNode }): React.ReactElement => (
      <PageProgressProvider>{children}</PageProgressProvider>
    );

    const { result } = renderHook(() => usePageProgress(), { wrapper });

    expect(typeof result.current.start).toBe("function");
    expect(typeof result.current.done).toBe("function");
    expect(typeof result.current.increment).toBe("function");
    expect(result.current.isAnimating).toBe(false);
    expect(result.current.progress).toBe(0);
  });
});
