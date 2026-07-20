// @vitest-environment jsdom
/**
 * @file use-progress-tabs.spec.tsx
 * @module @stackra/ui/__tests__/unit
 * @description Behavioural spec for `useProgressTabs` — verifies the
 *   guard error thrown when called outside a `<ProgressTabs>` root
 *   and the happy-path context shape observed by a compound child
 *   rendered inside a real `<ProgressTabs>` tree.
 */

import { cleanup, render, renderHook, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import React from "react";

import { ProgressTabs } from "@/react/components/progress-tabs/progress-tabs.component";
import { useProgressTabs } from "@/react/hooks/use-progress-tabs/use-progress-tabs.hook";

afterEach(cleanup);

describe("useProgressTabs", () => {
  it("throws when called outside a <ProgressTabs> tree", () => {
    expect(() => renderHook(() => useProgressTabs())).toThrow(
      /must be used within a <ProgressTabs>/,
    );
  });

  it("exposes the active key, step registry, and setActiveKey from context", () => {
    function Probe(): React.ReactElement {
      const ctx = useProgressTabs();

      return (
        <div>
          <span data-testid="active-key">{ctx.activeKey}</span>
          <span data-testid="steps">{ctx.steps.join(",")}</span>
          <span data-testid="setter-type">{typeof ctx.setActiveKey}</span>
        </div>
      );
    }

    render(
      <ProgressTabs defaultSelectedKey="a">
        <ProgressTabs.List aria-label="steps">
          <ProgressTabs.Trigger value="a">A</ProgressTabs.Trigger>
          <ProgressTabs.Trigger value="b">B</ProgressTabs.Trigger>
        </ProgressTabs.List>
        <Probe />
      </ProgressTabs>,
    );

    expect(screen.getByTestId("active-key").textContent).toBe("a");
    // Triggers register on mount — both step keys should be present.
    expect(screen.getByTestId("steps").textContent).toBe("a,b");
    expect(screen.getByTestId("setter-type").textContent).toBe("function");
  });
});
