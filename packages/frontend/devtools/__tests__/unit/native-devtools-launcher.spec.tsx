// @vitest-environment jsdom
/**
 * @file native-devtools-launcher.spec.tsx
 * @module @stackra/devtools/tests/unit
 * @description Smoke test for the native `<DevtoolsLauncher />`.
 *
 *   React Native primitives are stubbed with plain DOM elements so
 *   the render passes under jsdom. This test verifies the
 *   component tree assembles without throwing — behavioural
 *   assertions live in the web launcher spec since the shape is
 *   identical.
 */

import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

// Stub react-native primitives — `View`, `Text` become plain DOM
// elements.
vi.mock("react-native", () => ({
  View: ({ children, ...rest }: { readonly children?: ReactNode }) => (
    <div {...rest}>{children}</div>
  ),
  Text: ({ children, ...rest }: { readonly children?: ReactNode }) => (
    <span {...rest}>{children}</span>
  ),
  Pressable: ({
    children,
    onPress,
    ...rest
  }: {
    readonly children?: ReactNode;
    readonly onPress?: () => void;
  }) => (
    <button type="button" onClick={onPress} {...rest}>
      {children}
    </button>
  ),
  ScrollView: ({ children }: { readonly children?: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@stackra/ui/native", () => {
  function Chip({ children }: { readonly children?: ReactNode }) {
    return <div data-testid="chip">{children}</div>;
  }
  Chip.Label = ({ children }: { readonly children?: ReactNode }) => (
    <span data-testid="chip-label">{children}</span>
  );
  function PressableFeedback({
    children,
    onPress,
  }: {
    readonly children?: ReactNode;
    readonly onPress?: () => void;
  }) {
    return (
      <button type="button" onClick={onPress}>
        {children}
      </button>
    );
  }
  return { Chip, PressableFeedback };
});

/** Shared state consulted by the hook stubs. */
const state = {
  isOpen: false,
  update: vi.fn(),
  panels: [] as { readonly id: string; readonly title: string }[],
};

vi.mock("@/native/hooks/use-native-devtools-frame-state.hook", () => ({
  useNativeDevtoolsFrameState: () => ({
    state: { isOpen: state.isOpen },
    update: state.update,
  }),
}));

vi.mock("@/native/hooks/use-native-devtools-panels.hook", () => ({
  useNativeDevtoolsPanels: () => ({
    panels: state.panels,
    byCategory: new Map(),
    find: (id: string) => state.panels.find((p) => p.id === id) ?? null,
  }),
}));

import { DevtoolsLauncher } from "@/native/components/devtools-launcher";

afterEach(() => {
  cleanup();
  state.isOpen = false;
  state.panels = [];
  state.update = vi.fn();
});

describe("native <DevtoolsLauncher />", () => {
  it("renders without crashing", () => {
    state.panels = [
      { id: "a", title: "A" },
      { id: "b", title: "B" },
    ];
    const { getByTestId } = render(<DevtoolsLauncher />);
    expect(getByTestId("chip")).toBeDefined();
    expect(getByTestId("chip-label").textContent).toContain("2");
  });

  it("does not render when the sheet is open", () => {
    state.isOpen = true;
    const { queryByTestId } = render(<DevtoolsLauncher />);
    expect(queryByTestId("chip")).toBeNull();
  });
});
