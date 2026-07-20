// @vitest-environment jsdom
/**
 * @file use-devtools-frame-state.spec.tsx
 * @module @stackra/devtools/tests/unit
 * @description Tests `useDevtoolsFrameState` — hook reads state via
 *   `useSyncExternalStore` and pipes mutations through the frame-
 *   state service.
 */

import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { type ReactNode } from "react";

import { DevtoolsContext } from "@/react/contexts/devtools.context";
import type { IDevtoolsContextValue } from "@/react/contexts/devtools-context-value.interface";
import { DevtoolsFrameStateService } from "@/core/services/devtools-frame-state.service";
import { useDevtoolsFrameState } from "@/react/hooks/use-devtools-frame-state.hook";
import { mergeConfig } from "@/core/utils/merge-config.util";
import { MockDevtoolsPanelsRegistry } from "@/testing/mock-devtools-panels-registry";

afterEach(() => {
  cleanup();
});

/** Build a context value with a real frame-state service. */
function makeContext(): {
  readonly wrapper: ({ children }: { readonly children: ReactNode }) => React.JSX.Element;
  readonly frameState: DevtoolsFrameStateService;
} {
  const frameState = new DevtoolsFrameStateService(mergeConfig());
  frameState.onModuleInit();
  const value: IDevtoolsContextValue = {
    config: mergeConfig(),
    panels: new MockDevtoolsPanelsRegistry(),
    inspector: null as unknown as IDevtoolsContextValue["inspector"],
    frameState,
    analytics: null as unknown as IDevtoolsContextValue["analytics"],
    mountedAt: Date.now(),
  };
  const wrapper = ({ children }: { readonly children: ReactNode }): React.JSX.Element => (
    <DevtoolsContext.Provider value={value}>{children}</DevtoolsContext.Provider>
  );
  return { wrapper, frameState };
}

describe("useDevtoolsFrameState", () => {
  it("reads the current snapshot", () => {
    const { wrapper } = makeContext();
    const { result } = renderHook(() => useDevtoolsFrameState(), { wrapper });
    expect(result.current.state.isOpen).toBe(false);
    expect(result.current.state.activePanelId).toBeNull();
  });

  it("updates the shared state when update() is called", () => {
    const { wrapper } = makeContext();
    const { result } = renderHook(() => useDevtoolsFrameState(), { wrapper });
    act(() => {
      result.current.update({ isOpen: true, activePanelId: "my-panel" });
    });
    expect(result.current.state.isOpen).toBe(true);
    expect(result.current.state.activePanelId).toBe("my-panel");
  });

  it("two hooks stay in sync via the same underlying service", () => {
    const { wrapper } = makeContext();
    const { result: a } = renderHook(() => useDevtoolsFrameState(), { wrapper });
    const { result: b } = renderHook(() => useDevtoolsFrameState(), { wrapper });
    act(() => {
      a.current.update({ isOpen: true });
    });
    expect(b.current.state.isOpen).toBe(true);
  });
});
