// @vitest-environment jsdom
/**
 * @file devtools-shell.spec.tsx
 * @module @stackra/devtools/tests/unit
 * @description Tests for the web `<DevtoolsShell />` — verifies the
 *   drawer renders the empty state when no panels are registered,
 *   auto-selects the first panel on open, and dispatches to the
 *   active panel's viewport.
 */

import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';

// The shell only cares about a handful of HeroUI primitives; the
// rest are simple wrappers.
vi.mock('@stackra/ui/react', () => {
  function Drawer({ children }: { readonly children?: ReactNode }) {
    return <div data-testid="drawer-root">{children}</div>;
  }
  function Backdrop({
    children,
    isOpen,
  }: {
    readonly children?: ReactNode;
    readonly isOpen?: boolean;
  }) {
    return (
      <div data-testid="drawer-backdrop" data-open={String(Boolean(isOpen))}>
        {isOpen ? children : null}
      </div>
    );
  }
  Drawer.Backdrop = Backdrop;
  Drawer.Content = ({ children }: { readonly children?: ReactNode }) => (
    <div data-testid="drawer-content">{children}</div>
  );
  Drawer.Dialog = ({ children }: { readonly children?: ReactNode }) => <div>{children}</div>;
  Drawer.CloseTrigger = () => null;
  Drawer.Header = ({ children }: { readonly children?: ReactNode }) => <header>{children}</header>;
  Drawer.Heading = ({ children }: { readonly children?: ReactNode }) => <h2>{children}</h2>;
  Drawer.Body = ({ children }: { readonly children?: ReactNode }) => <div>{children}</div>;
  Drawer.Footer = ({ children }: { readonly children?: ReactNode }) => <footer>{children}</footer>;

  function Kbd({ children }: { readonly children?: ReactNode }) {
    return <kbd>{children}</kbd>;
  }
  Kbd.Content = ({ children }: { readonly children?: ReactNode }) => <span>{children}</span>;

  function Button({
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
  // Every inner primitive rendered by shell sub-components — the
  // details don't matter, we just need something render-safe.
  const Passthrough = ({ children }: { readonly children?: ReactNode }) => <div>{children}</div>;
  return {
    Drawer,
    Kbd,
    Button,
    Card: Passthrough,
    Chip: Object.assign(Passthrough, { Label: Passthrough }),
    PressableFeedback: (props: {
      readonly children?: ReactNode;
      readonly onClick?: () => void;
    }) => (
      <button type="button" onClick={props.onClick}>
        {props.children}
      </button>
    ),
    Menu: Object.assign(Passthrough, {
      Trigger: Passthrough,
      Content: Passthrough,
      Item: Passthrough,
    }),
    ScrollShadow: Passthrough,
    Tooltip: Object.assign(Passthrough, {
      Trigger: Passthrough,
      Content: Passthrough,
    }),
    Input: () => <input />,
    Popover: Object.assign(Passthrough, {
      Trigger: Passthrough,
      Content: Passthrough,
    }),
    Divider: Passthrough,
    IconButton: Passthrough,
  };
});

vi.mock('@stackra/ui/icons/heroicon/outline', () => {
  const Stub = () => <span />;
  return {
    XMarkIcon: Stub,
    ChevronDownIcon: Stub,
    ArrowsPointingInIcon: Stub,
    ArrowsPointingOutIcon: Stub,
    Bars3Icon: Stub,
    MagnifyingGlassIcon: Stub,
    CursorArrowRaysIcon: Stub,
    XCircleIcon: Stub,
    EyeIcon: Stub,
    EyeSlashIcon: Stub,
    LockClosedIcon: Stub,
  };
});

// Mock the inspector toolbar / position menu / search — they pull
// from the inspector context which our test doesn't set up.
vi.mock('@/react/components/devtools-inspector-toolbar', () => ({
  DevtoolsInspectorToolbar: () => <div data-testid="inspector-toolbar" />,
}));
vi.mock('@/react/components/devtools-position-menu', () => ({
  DevtoolsPositionMenu: () => <div data-testid="position-menu" />,
}));
vi.mock('@/react/components/devtools-search', () => ({
  DevtoolsSearch: () => <div data-testid="search" />,
}));
vi.mock('@/react/hooks/use-devtools-search.hook', () => ({
  useDevtoolsSearch: () => ({ query: '', setQuery: () => undefined }),
}));
vi.mock('@/react/components/devtools-nav-rail', () => ({
  DevtoolsNavRail: () => <div data-testid="nav-rail" />,
}));
vi.mock('@/react/components/devtools-panel-empty', () => ({
  DevtoolsPanelEmpty: () => <div data-testid="panel-empty">Empty</div>,
}));
vi.mock('@/react/components/devtools-panel-frame', () => ({
  DevtoolsPanelFrame: ({ panel }: { readonly panel: { readonly id: string } }) => (
    <div data-testid="panel-frame" data-panel-id={panel.id} />
  ),
}));

import { DevtoolsContext } from '@/react/contexts/devtools.context';
import type { IDevtoolsContextValue } from '@/react/contexts/devtools-context-value.interface';
import { DevtoolsFrameStateService } from '@/core/services/devtools-frame-state.service';
import { DevtoolsShell } from '@/react/components/devtools-shell';
import { createMockDevtoolsPanel } from '@/testing/create-mock-devtools-panel.util';
import { mergeConfig } from '@/core/utils/merge-config.util';
import { MockDevtoolsPanelsRegistry } from '@/testing/mock-devtools-panels-registry';

afterEach(() => {
  cleanup();
});

/** Build a shell context with the given panels + `isOpen`. */
function withShellContext(
  panels: MockDevtoolsPanelsRegistry,
  isOpen: boolean
): {
  readonly wrapper: ({ children }: { readonly children: ReactNode }) => React.JSX.Element;
} {
  const frameState = new DevtoolsFrameStateService(mergeConfig());
  frameState.onModuleInit();
  frameState.update({ isOpen });
  const analytics = { shellOpened: vi.fn(), shellClosed: vi.fn() } as unknown;
  const value: IDevtoolsContextValue = {
    config: mergeConfig(),
    panels,
    inspector: null as unknown as IDevtoolsContextValue['inspector'],
    frameState,
    analytics: analytics as IDevtoolsContextValue['analytics'],
    mountedAt: Date.now(),
  };
  const wrapper = ({ children }: { readonly children: ReactNode }): React.JSX.Element => (
    <DevtoolsContext.Provider value={value}>{children}</DevtoolsContext.Provider>
  );
  return { wrapper };
}

describe('<DevtoolsShell />', () => {
  it('renders drawer content when open', () => {
    const registry = new MockDevtoolsPanelsRegistry();
    registry.register(createMockDevtoolsPanel({ id: 'a', title: 'A' }));
    const { wrapper: Wrapper } = withShellContext(registry, true);
    const { getByTestId } = render(
      <Wrapper>
        <DevtoolsShell />
      </Wrapper>
    );
    expect(getByTestId('drawer-backdrop').getAttribute('data-open')).toBe('true');
  });

  it('collapses drawer content when closed', () => {
    const registry = new MockDevtoolsPanelsRegistry();
    const { wrapper: Wrapper } = withShellContext(registry, false);
    const { getByTestId } = render(
      <Wrapper>
        <DevtoolsShell />
      </Wrapper>
    );
    expect(getByTestId('drawer-backdrop').getAttribute('data-open')).toBe('false');
  });

  it('shows the empty state when no panels are registered', () => {
    const registry = new MockDevtoolsPanelsRegistry();
    const { wrapper: Wrapper } = withShellContext(registry, true);
    const { getByTestId } = render(
      <Wrapper>
        <DevtoolsShell />
      </Wrapper>
    );
    expect(getByTestId('panel-empty')).toBeDefined();
  });

  it('renders the active panel frame when a panel is selected', () => {
    const registry = new MockDevtoolsPanelsRegistry();
    registry.register(createMockDevtoolsPanel({ id: 'first', title: 'First' }));
    registry.register(createMockDevtoolsPanel({ id: 'second', title: 'Second' }));
    const { wrapper: Wrapper } = withShellContext(registry, true);
    const { getByTestId } = render(
      <Wrapper>
        <DevtoolsShell />
      </Wrapper>
    );
    // Auto-select is applied by the shell — the first panel wins
    // once the drawer is open with no active id.
    const frame = getByTestId('panel-frame');
    expect(frame.getAttribute('data-panel-id')).toBe('first');
  });
});
