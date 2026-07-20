// @vitest-environment jsdom
/**
 * @file devtools-launcher.spec.tsx
 * @module @stackra/devtools/tests/unit
 * @description Tests for the web `<DevtoolsLauncher />` — verifies
 *   the launcher hides when the shell is open and toggles the
 *   frame-state on click.
 *
 *   `@stackra/ui/react` primitives are mocked with light DOM stubs
 *   so the test never depends on HeroUI Pro rendering in jsdom.
 */

import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

// ── Stubs for HeroUI primitives ──────────────────────────────────
// The DevtoolsLauncher only touches `Chip`, `Chip.Label`, and
// `PressableFeedback` — swap them for tag-preserving wrappers.
vi.mock("@stackra/ui/react", () => {
  function Chip({ children, ...rest }: { readonly children?: ReactNode }) {
    return (
      <div data-testid="chip" {...rest}>
        {children}
      </div>
    );
  }
  Chip.Label = ({ children }: { readonly children?: ReactNode }) => (
    <span data-testid="chip-label">{children}</span>
  );
  function PressableFeedback({
    children,
    onClick,
    ...rest
  }: {
    readonly children?: ReactNode;
    readonly onClick?: () => void;
    readonly [k: string]: unknown;
  }) {
    return (
      <button type="button" onClick={onClick} {...rest}>
        {children}
      </button>
    );
  }
  return { Chip, PressableFeedback };
});

vi.mock("@stackra/ui/icons/heroicon/outline", () => ({
  WrenchScrewdriverIcon: ({ "aria-hidden": ariaHidden }: { readonly "aria-hidden"?: string }) => (
    <span data-testid="icon-wrench" aria-hidden={ariaHidden} />
  ),
}));

import { DevtoolsContext } from "@/react/contexts/devtools.context";
import type { IDevtoolsContextValue } from "@/react/contexts/devtools-context-value.interface";
import { DevtoolsFrameStateService } from "@/core/services/devtools-frame-state.service";
import { DevtoolsLauncher } from "@/react/components/devtools-launcher";
import { mergeConfig } from "@/core/utils/merge-config.util";
import { createMockDevtoolsPanel } from "@/testing/create-mock-devtools-panel.util";
import { MockDevtoolsPanelsRegistry } from "@/testing/mock-devtools-panels-registry";

afterEach(() => {
  cleanup();
});

/** Build a devtools context with the given open state. */
function withContext(isOpen: boolean): {
  readonly wrapper: ({ children }: { readonly children: ReactNode }) => React.JSX.Element;
  readonly frameState: DevtoolsFrameStateService;
  readonly panels: MockDevtoolsPanelsRegistry;
} {
  const frameState = new DevtoolsFrameStateService(mergeConfig());
  frameState.onModuleInit();
  frameState.update({ isOpen });
  const panels = new MockDevtoolsPanelsRegistry();
  panels.register(createMockDevtoolsPanel({ id: "a" }));
  panels.register(createMockDevtoolsPanel({ id: "b" }));
  const value: IDevtoolsContextValue = {
    config: mergeConfig(),
    panels,
    inspector: null as unknown as IDevtoolsContextValue["inspector"],
    frameState,
    analytics: null as unknown as IDevtoolsContextValue["analytics"],
    mountedAt: Date.now(),
  };
  const wrapper = ({ children }: { readonly children: ReactNode }): React.JSX.Element => (
    <DevtoolsContext.Provider value={value}>{children}</DevtoolsContext.Provider>
  );
  return { wrapper, frameState, panels };
}

describe("<DevtoolsLauncher />", () => {
  it("renders when the shell is closed", () => {
    const { wrapper: Wrapper } = withContext(false);
    const { queryByTestId } = render(
      <Wrapper>
        <DevtoolsLauncher />
      </Wrapper>,
    );
    expect(queryByTestId("chip")).not.toBeNull();
  });

  it("does not render when the shell is open", () => {
    const { wrapper: Wrapper } = withContext(true);
    const { queryByTestId } = render(
      <Wrapper>
        <DevtoolsLauncher />
      </Wrapper>,
    );
    expect(queryByTestId("chip")).toBeNull();
  });

  it("opens the shell on click", () => {
    const { wrapper: Wrapper, frameState } = withContext(false);
    const { getByRole } = render(
      <Wrapper>
        <DevtoolsLauncher />
      </Wrapper>,
    );
    act(() => {
      fireEvent.click(getByRole("button"));
    });
    expect(frameState.getSnapshot().isOpen).toBe(true);
  });
});
