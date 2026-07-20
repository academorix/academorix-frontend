// @vitest-environment jsdom
/**
 * @file devtools-panel-view.spec.tsx
 * @module @stackra/devtools/tests/unit
 * @description Tests the `<DevtoolsPanelView />` dispatcher —
 *   verifies each `view.type` branch renders the correct
 *   affordance.
 */

import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

vi.mock("@stackra/ui/react", () => {
  function ScrollShadow({ children }: { readonly children?: ReactNode }) {
    return <div data-testid="scroll-shadow">{children}</div>;
  }
  function Card({ children }: { readonly children?: ReactNode }) {
    return <div data-testid="card">{children}</div>;
  }
  Card.Header = ({ children }: { readonly children?: ReactNode }) => <div>{children}</div>;
  Card.Title = ({ children }: { readonly children?: ReactNode }) => <h3>{children}</h3>;
  Card.Description = ({ children }: { readonly children?: ReactNode }) => <p>{children}</p>;
  Card.Footer = ({ children }: { readonly children?: ReactNode }) => <div>{children}</div>;
  function Button({
    children,
    onPress,
    ...rest
  }: {
    readonly children?: ReactNode;
    readonly onPress?: () => void;
    readonly [k: string]: unknown;
  }) {
    return (
      <button type="button" onClick={onPress} {...rest}>
        {children}
      </button>
    );
  }
  // AlertDialog compound — the panel-view only renders the outer
  // shell; we short-circuit the whole thing to keep the render
  // predictable.
  function AlertDialog({ children }: { readonly children?: ReactNode }) {
    return <div data-testid="alert-dialog">{children}</div>;
  }
  function Backdrop({
    children,
    isOpen,
    onOpenChange,
  }: {
    readonly children?: ReactNode;
    readonly isOpen?: boolean;
    readonly onOpenChange?: (open: boolean) => void;
  }) {
    // Expose the props on a data attribute so tests can inspect
    // the open state without walking the tree.
    return (
      <div
        data-testid="alert-backdrop"
        data-open={String(Boolean(isOpen))}
        onClick={() => onOpenChange?.(false)}
      >
        {children}
      </div>
    );
  }
  AlertDialog.Backdrop = Backdrop;
  AlertDialog.Container = ({ children }: { readonly children?: ReactNode }) => (
    <div>{children}</div>
  );
  AlertDialog.Dialog = ({ children }: { readonly children?: ReactNode }) => <div>{children}</div>;
  AlertDialog.CloseTrigger = () => <button type="button">×</button>;
  AlertDialog.Header = ({ children }: { readonly children?: ReactNode }) => <div>{children}</div>;
  AlertDialog.Heading = ({ children }: { readonly children?: ReactNode }) => <h2>{children}</h2>;
  AlertDialog.Body = ({ children }: { readonly children?: ReactNode }) => <div>{children}</div>;
  AlertDialog.Footer = ({ children }: { readonly children?: ReactNode }) => <div>{children}</div>;

  return { AlertDialog, Button, Card, ScrollShadow };
});

import { DevtoolsContext } from "@/react/contexts/devtools.context";
import type { IDevtoolsContextValue } from "@/react/contexts/devtools-context-value.interface";
import { DevtoolsPanelView } from "@/react/components/devtools-panel-view";
import { createMockDevtoolsPanel } from "@/testing/create-mock-devtools-panel.util";
import { mergeConfig } from "@/core/utils/merge-config.util";
import { MockDevtoolsPanelsRegistry } from "@/testing/mock-devtools-panels-registry";
import { DevtoolsFrameStateService } from "@/core/services/devtools-frame-state.service";

afterEach(() => {
  cleanup();
});

/** Wrap children in a devtools context. */
function wrapWithContext(children: ReactNode): React.JSX.Element {
  const frameState = new DevtoolsFrameStateService(mergeConfig());
  frameState.onModuleInit();
  const analytics = { actionTriggered: vi.fn(), panelActivated: vi.fn() } as unknown;
  const value: IDevtoolsContextValue = {
    config: mergeConfig(),
    panels: new MockDevtoolsPanelsRegistry(),
    inspector: null as unknown as IDevtoolsContextValue["inspector"],
    frameState,
    analytics: analytics as IDevtoolsContextValue["analytics"],
    mountedAt: Date.now(),
  };
  return <DevtoolsContext.Provider value={value}>{children}</DevtoolsContext.Provider>;
}

describe("<DevtoolsPanelView />", () => {
  it("renders component views", () => {
    const panel = createMockDevtoolsPanel({
      id: "ct",
      view: {
        type: "component",
        render: () => <div data-testid="component-body">Hello!</div>,
      },
    });
    const { getByTestId } = render(wrapWithContext(<DevtoolsPanelView panel={panel} />));
    expect(getByTestId("component-body").textContent).toBe("Hello!");
  });

  it("renders each action as a card + button", () => {
    const handle = vi.fn();
    const panel = createMockDevtoolsPanel({
      id: "act",
      view: {
        type: "action",
        actions: [
          { id: "reload", label: "Reload", handle },
          { id: "reset", label: "Reset", handle: () => undefined },
        ],
      },
    });
    const { getAllByTestId, container } = render(
      wrapWithContext(<DevtoolsPanelView panel={panel} />),
    );
    expect(getAllByTestId("card")).toHaveLength(2);
    // Reload button should fire immediately (no confirmation) —
    // target by `data-devtools-action` so the query is unambiguous.
    const reloadBtn = container.querySelector('[data-devtools-action="reload"]');
    expect(reloadBtn).not.toBeNull();
    act(() => {
      fireEvent.click(reloadBtn as Element);
    });
    expect(handle).toHaveBeenCalledOnce();
  });

  it("opens the confirmation dialog for actions that require it", () => {
    const handle = vi.fn();
    const panel = createMockDevtoolsPanel({
      id: "act",
      view: {
        type: "action",
        actions: [
          {
            id: "nuke",
            label: "Nuke",
            requireConfirmation: true,
            handle,
          },
        ],
      },
    });
    const { container, getByTestId } = render(wrapWithContext(<DevtoolsPanelView panel={panel} />));
    // First click opens the dialog — handle must NOT fire.
    const nukeBtn = container.querySelector('[data-devtools-action="nuke"]');
    expect(nukeBtn).not.toBeNull();
    act(() => {
      fireEvent.click(nukeBtn as Element);
    });
    expect(handle).not.toHaveBeenCalled();
    expect(getByTestId("alert-backdrop").getAttribute("data-open")).toBe("true");
  });

  it("renders an iframe for iframe views", () => {
    const panel = createMockDevtoolsPanel({
      id: "if",
      view: { type: "iframe", src: "about:blank" },
    });
    const { getByTestId } = render(wrapWithContext(<DevtoolsPanelView panel={panel} />));
    expect(getByTestId("devtools-panel-iframe").getAttribute("src")).toBe("about:blank");
  });
});
