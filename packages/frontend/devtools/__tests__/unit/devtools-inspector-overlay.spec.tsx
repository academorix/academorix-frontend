// @vitest-environment jsdom
/**
 * @file devtools-inspector-overlay.spec.tsx
 * @module @stackra/devtools/tests/unit
 * @description Tests for the web `<DevtoolsInspectorOverlay />`.
 *
 *   The `useDevtoolsInspector` hook is mocked so the overlay
 *   receives stable region references — the production
 *   `collectAll()` returns a fresh array per call which is fine
 *   under React's concurrent scheduling but triggers
 *   `useSyncExternalStore`'s tearing detection under strict
 *   test rendering.
 */

import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import type { IDevtoolsInspectorRegion } from "@stackra/contracts";

vi.mock("@stackra/ui/react", () => {
  function Tooltip({ children }: { readonly children?: ReactNode }) {
    return <div>{children}</div>;
  }
  Tooltip.Trigger = ({ children }: { readonly children?: ReactNode }) => <>{children}</>;
  Tooltip.Content = ({ children }: { readonly children?: ReactNode }) => <span>{children}</span>;
  return { Tooltip };
});

/** Shared mutable holder — flipped per test. */
const inspectorState: {
  enabled: boolean;
  regions: readonly IDevtoolsInspectorRegion[];
  setEnabled: ReturnType<typeof vi.fn>;
  toggle: ReturnType<typeof vi.fn>;
} = {
  enabled: false,
  regions: [],
  setEnabled: vi.fn(),
  toggle: vi.fn(),
};

vi.mock("@/react/hooks/use-devtools-inspector", () => ({
  useDevtoolsInspector: () => inspectorState,
}));

import { DevtoolsContext } from "@/react/contexts";
import type { IDevtoolsContextValue } from "@/react/contexts/devtools-context-value.interface";
import { DevtoolsInspectorOverlay } from "@/react/components/devtools-inspector-overlay";
import { DevtoolsFrameStateService } from "@/core/services/devtools-frame-state.service";
import { MockDevtoolsInspectorRegistry } from "@/testing/mock-devtools-inspector-registry";
import { MockDevtoolsPanelsRegistry } from "@/testing/mock-devtools-panels-registry";
import { createMockDevtoolsPanel } from "@/testing/create-mock-devtools-panel.util";
import { mergeConfig } from "@/core/utils/merge-config.util";

afterEach(() => {
  cleanup();
  // Reset the inspector state between tests so they don't leak.
  inspectorState.enabled = false;
  inspectorState.regions = [];
  inspectorState.setEnabled = vi.fn();
  inspectorState.toggle = vi.fn();
});

/** Build a mock analytics that records every call. */
function makeAnalytics(): {
  readonly inspectorRegionClicked: ReturnType<typeof vi.fn>;
  readonly panelActivated: ReturnType<typeof vi.fn>;
} {
  return {
    inspectorRegionClicked: vi.fn(),
    panelActivated: vi.fn(),
  };
}

/** Build a wrapper with the devtools context. */
function withOverlayContext({
  panels,
  analytics,
}: {
  readonly panels: MockDevtoolsPanelsRegistry;
  readonly analytics: ReturnType<typeof makeAnalytics>;
}): {
  readonly wrapper: ({ children }: { readonly children: ReactNode }) => React.JSX.Element;
  readonly frameState: DevtoolsFrameStateService;
} {
  const frameState = new DevtoolsFrameStateService(mergeConfig());
  frameState.onModuleInit();
  const value: IDevtoolsContextValue = {
    config: mergeConfig(),
    panels,
    inspector: new MockDevtoolsInspectorRegistry(),
    frameState,
    analytics: analytics as unknown as IDevtoolsContextValue["analytics"],
    mountedAt: Date.now(),
  };
  const wrapper = ({ children }: { readonly children: ReactNode }): React.JSX.Element => (
    <DevtoolsContext.Provider value={value}>{children}</DevtoolsContext.Provider>
  );
  return { wrapper, frameState };
}

describe("<DevtoolsInspectorOverlay />", () => {
  it("does not render when disabled", () => {
    inspectorState.enabled = false;
    const panels = new MockDevtoolsPanelsRegistry();
    const { wrapper: Wrapper } = withOverlayContext({ panels, analytics: makeAnalytics() });
    const { container } = render(
      <Wrapper>
        <DevtoolsInspectorOverlay />
      </Wrapper>,
    );
    expect(container.querySelector("[data-devtools-inspector-overlay]")).toBeNull();
  });

  it("renders every region from the registry", () => {
    inspectorState.enabled = true;
    inspectorState.regions = [
      { id: "r1", label: "r1", panelId: "route", bounds: new DOMRect(0, 0, 10, 10) },
      { id: "r2", label: "r2", panelId: "route", bounds: new DOMRect(10, 10, 10, 10) },
    ];
    const panels = new MockDevtoolsPanelsRegistry();
    panels.register(createMockDevtoolsPanel({ id: "route" }));
    const { wrapper: Wrapper } = withOverlayContext({ panels, analytics: makeAnalytics() });
    const { container } = render(
      <Wrapper>
        <DevtoolsInspectorOverlay />
      </Wrapper>,
    );
    expect(container.querySelectorAll("[data-devtools-inspector-region]")).toHaveLength(2);
  });

  it("clicking a region activates the panel + fires the event", () => {
    inspectorState.enabled = true;
    inspectorState.regions = [
      { id: "r1", label: "r1", panelId: "route", bounds: new DOMRect(0, 0, 10, 10) },
    ];
    const panels = new MockDevtoolsPanelsRegistry();
    panels.register(createMockDevtoolsPanel({ id: "route" }));
    const analytics = makeAnalytics();
    const { wrapper: Wrapper, frameState } = withOverlayContext({ panels, analytics });
    const { container } = render(
      <Wrapper>
        <DevtoolsInspectorOverlay />
      </Wrapper>,
    );
    const region = container.querySelector('[data-devtools-inspector-region="r1"]') as HTMLElement;
    expect(region).not.toBeNull();
    act(() => {
      fireEvent.click(region);
    });
    expect(analytics.inspectorRegionClicked).toHaveBeenCalledWith("r1", "route");
    expect(frameState.getSnapshot().activePanelId).toBe("route");
    expect(frameState.getSnapshot().isOpen).toBe(true);
    // Overlay disables itself after a click.
    expect(inspectorState.setEnabled).toHaveBeenCalledWith(false);
  });

  it("Escape closes the overlay", () => {
    inspectorState.enabled = true;
    inspectorState.regions = [];
    const panels = new MockDevtoolsPanelsRegistry();
    const { wrapper: Wrapper } = withOverlayContext({ panels, analytics: makeAnalytics() });
    render(
      <Wrapper>
        <DevtoolsInspectorOverlay />
      </Wrapper>,
    );
    act(() => {
      fireEvent.keyDown(window, { key: "Escape" });
    });
    expect(inspectorState.setEnabled).toHaveBeenCalledWith(false);
  });
});
