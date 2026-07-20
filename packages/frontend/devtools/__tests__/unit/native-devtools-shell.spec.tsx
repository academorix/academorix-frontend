// @vitest-environment jsdom
/**
 * @file native-devtools-shell.spec.tsx
 * @module @stackra/devtools/tests/unit
 * @description Smoke test for the native `<DevtoolsShell />` — it
 *   renders the bottom-sheet compound without crashing.
 */

import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

vi.mock("react-native", () => ({
  View: ({ children }: { readonly children?: ReactNode }) => <div>{children}</div>,
  Text: ({ children }: { readonly children?: ReactNode }) => <span>{children}</span>,
  Pressable: ({
    children,
    onPress,
  }: {
    readonly children?: ReactNode;
    readonly onPress?: () => void;
  }) => (
    <button type="button" onClick={onPress}>
      {children}
    </button>
  ),
  ScrollView: ({ children }: { readonly children?: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@stackra/ui/native", () => {
  function BottomSheet({
    children,
    isOpen,
  }: {
    readonly children?: ReactNode;
    readonly isOpen?: boolean;
  }) {
    return (
      <div data-testid="bottom-sheet" data-open={String(Boolean(isOpen))}>
        {children}
      </div>
    );
  }
  const Passthrough = ({ children }: { readonly children?: ReactNode }) => <div>{children}</div>;
  BottomSheet.Portal = Passthrough;
  BottomSheet.Overlay = () => <div data-testid="overlay" />;
  BottomSheet.Content = Passthrough;
  BottomSheet.Title = ({ children }: { readonly children?: ReactNode }) => (
    <h2 data-testid="sheet-title">{children}</h2>
  );
  function Chip({ children }: { readonly children?: ReactNode }) {
    return <div data-testid="chip">{children}</div>;
  }
  Chip.Label = ({ children }: { readonly children?: ReactNode }) => <span>{children}</span>;
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
  return { BottomSheet, Chip, PressableFeedback };
});

const state = {
  isOpen: true,
  activePanelId: null as string | null,
  update: vi.fn(),
  panels: [] as { readonly id: string; readonly title: string; readonly view: unknown }[],
};

vi.mock("@/native/hooks/use-native-devtools-frame-state.hook", () => ({
  useNativeDevtoolsFrameState: () => ({
    state: { isOpen: state.isOpen, activePanelId: state.activePanelId },
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

// Stub out the panel view — it drags in more UI primitives.
vi.mock("@/native/components/devtools-panel-view", () => ({
  DevtoolsPanelView: ({ panel }: { readonly panel: { readonly id: string } }) => (
    <div data-testid="panel-view" data-panel-id={panel.id} />
  ),
}));

import { DevtoolsShell } from "@/native/components/devtools-shell";

afterEach(() => {
  cleanup();
  state.isOpen = true;
  state.activePanelId = null;
  state.panels = [];
  state.update = vi.fn();
});

describe("native <DevtoolsShell />", () => {
  it("renders the bottom sheet without crashing", () => {
    state.panels = [{ id: "a", title: "A", view: { type: "component", render: () => null } }];
    const { getByTestId } = render(<DevtoolsShell />);
    expect(getByTestId("bottom-sheet")).toBeDefined();
    expect(getByTestId("sheet-title").textContent).toBe("Devtools");
  });

  it("shows a chip per registered panel", () => {
    state.panels = [
      { id: "a", title: "Alpha", view: { type: "component", render: () => null } },
      { id: "b", title: "Beta", view: { type: "component", render: () => null } },
    ];
    const { getAllByTestId } = render(<DevtoolsShell />);
    expect(getAllByTestId("chip")).toHaveLength(2);
  });
});
