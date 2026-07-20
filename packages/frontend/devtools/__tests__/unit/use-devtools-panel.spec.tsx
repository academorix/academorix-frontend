// @vitest-environment jsdom
/**
 * @file use-devtools-panel.spec.tsx
 * @module @stackra/devtools/tests/unit
 * @description Tests the ad-hoc `useDevtoolsPanel` registration hook
 *   — the hook should register on mount and unregister on unmount.
 */

import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useEffect } from "react";

import { DevtoolsContext } from "@/react/contexts/devtools.context";
import type { IDevtoolsContextValue } from "@/react/contexts/devtools-context-value.interface";
import { useDevtoolsPanel } from "@/react/hooks/use-devtools-panel.hook";
import { createMockDevtoolsPanel } from "@/testing/create-mock-devtools-panel.util";
import { MockDevtoolsPanelsRegistry } from "@/testing/mock-devtools-panels-registry";

afterEach(() => {
  cleanup();
});

/** Build the shape `useDevtoolsPanel` needs from the context. */
function makeContextValue(panels: MockDevtoolsPanelsRegistry): IDevtoolsContextValue {
  return {
    config: { enabled: true },
    panels,
    // The hook doesn't read the inspector / frame-state / analytics
    // fields, but the context requires them.
    inspector: null as unknown as IDevtoolsContextValue["inspector"],
    frameState: null as unknown as IDevtoolsContextValue["frameState"],
    analytics: null as unknown as IDevtoolsContextValue["analytics"],
    mountedAt: Date.now(),
  };
}

/** Test-only host that mounts the hook then optionally unmounts it. */
function HookHost({ id }: { readonly id: string }): null {
  useDevtoolsPanel(createMockDevtoolsPanel({ id }));
  useEffect(() => undefined);
  return null;
}

describe("useDevtoolsPanel", () => {
  it("registers the panel on mount", () => {
    const registry = new MockDevtoolsPanelsRegistry();
    render(
      <DevtoolsContext.Provider value={makeContextValue(registry)}>
        <HookHost id="my-panel" />
      </DevtoolsContext.Provider>,
    );
    expect(registry.size).toBe(1);
    expect(registry.find("my-panel")?.id).toBe("my-panel");
  });

  it("unregisters the panel on unmount", () => {
    const registry = new MockDevtoolsPanelsRegistry();
    const { unmount } = render(
      <DevtoolsContext.Provider value={makeContextValue(registry)}>
        <HookHost id="my-panel" />
      </DevtoolsContext.Provider>,
    );
    expect(registry.size).toBe(1);
    act(() => {
      unmount();
    });
    expect(registry.size).toBe(0);
  });
});
