// @vitest-environment jsdom
/**
 * @file actions-panel.spec.tsx
 * @module @stackra/devtools/tests/unit
 * @description Tests for the built-in web `<ActionsPanel />`.
 */

import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';

vi.mock('@stackra/ui/react', () => {
  const Div = ({
    children,
    className,
  }: {
    readonly children?: ReactNode;
    readonly className?: string;
  }) => <div className={className}>{children}</div>;
  function Card({ children }: { readonly children?: ReactNode }) {
    return <div data-testid="card">{children}</div>;
  }
  Card.Header = Div;
  Card.Content = Div;
  Card.Title = ({ children }: { readonly children?: ReactNode }) => <h3>{children}</h3>;
  Card.Description = ({ children }: { readonly children?: ReactNode }) => <p>{children}</p>;
  Card.Footer = Div;
  function Button({
    children,
    onPress,
    isDisabled,
    'data-devtools-action': dataAction,
  }: {
    readonly children?: ReactNode;
    readonly onPress?: () => void;
    readonly isDisabled?: boolean;
    readonly 'data-devtools-action'?: string;
  }) {
    return (
      <button
        type="button"
        data-devtools-action={dataAction}
        disabled={isDisabled}
        onClick={onPress}
      >
        {children}
      </button>
    );
  }
  function AlertDialog({ children }: { readonly children?: ReactNode }) {
    return <div>{children}</div>;
  }
  function Backdrop({
    children,
    isOpen,
  }: {
    readonly children?: ReactNode;
    readonly isOpen?: boolean;
  }) {
    return (
      <div data-testid="alert-open" data-open={String(Boolean(isOpen))}>
        {isOpen ? children : null}
      </div>
    );
  }
  AlertDialog.Backdrop = Backdrop;
  AlertDialog.Container = Div;
  AlertDialog.Dialog = Div;
  AlertDialog.CloseTrigger = () => null;
  AlertDialog.Header = Div;
  AlertDialog.Heading = ({ children }: { readonly children?: ReactNode }) => <h2>{children}</h2>;
  AlertDialog.Body = Div;
  AlertDialog.Footer = Div;
  return { AlertDialog, Button, Card };
});

vi.mock('@stackra/ui/icons/heroicon/outline', () => {
  const Stub = () => <span />;
  return {
    ArrowPathIcon: Stub,
    CircleStackIcon: Stub,
    ClipboardDocumentIcon: Stub,
    QueueListIcon: Stub,
    RectangleGroupIcon: Stub,
    TrashIcon: Stub,
  };
});

/** All optional injects are absent by default. Test can flip them. */
const injectMocks: Record<symbol, unknown> = {};

vi.mock('@stackra/container/react', () => ({
  useOptionalInject: <T,>(token: symbol): T | undefined => injectMocks[token] as T,
}));

import {
  CACHE_MANAGER,
  DISCOVERY_SERVICE,
  QUEUE_MANAGER,
  SCOPE_SERVICE,
  STATE_REGISTRY,
} from '@stackra/contracts';

import { DevtoolsContext } from '@/react/contexts/devtools.context';
import type { IDevtoolsContextValue } from '@/react/contexts/devtools-context-value.interface';
import { ActionsPanel } from '@/react/components/actions-panel';
import { DevtoolsFrameStateService } from '@/core/services/devtools-frame-state.service';
import { mergeConfig } from '@/core/utils/merge-config.util';
import { MockDevtoolsInspectorRegistry } from '@/testing/mock-devtools-inspector-registry';
import { MockDevtoolsPanelsRegistry } from '@/testing/mock-devtools-panels-registry';

afterEach(() => {
  cleanup();
  // Clear the token→instance map between tests so behaviour
  // doesn't leak across cases.
  Object.getOwnPropertySymbols(injectMocks).forEach((s) => delete injectMocks[s]);
  delete (injectMocks as Record<PropertyKey, unknown>)[CACHE_MANAGER as unknown as string];
  delete (injectMocks as Record<PropertyKey, unknown>)[QUEUE_MANAGER as unknown as string];
  delete (injectMocks as Record<PropertyKey, unknown>)[SCOPE_SERVICE as unknown as string];
  delete (injectMocks as Record<PropertyKey, unknown>)[STATE_REGISTRY as unknown as string];
  delete (injectMocks as Record<PropertyKey, unknown>)[DISCOVERY_SERVICE as unknown as string];
});

/** Build the devtools context. */
function wrapContext(
  children: ReactNode,
  analytics: { actionTriggered: ReturnType<typeof vi.fn> }
): React.JSX.Element {
  const frameState = new DevtoolsFrameStateService(mergeConfig());
  frameState.onModuleInit();
  const value: IDevtoolsContextValue = {
    config: mergeConfig(),
    panels: new MockDevtoolsPanelsRegistry(),
    inspector: new MockDevtoolsInspectorRegistry(),
    frameState,
    analytics: analytics as unknown as IDevtoolsContextValue['analytics'],
    mountedAt: Date.now(),
  };
  return <DevtoolsContext.Provider value={value}>{children}</DevtoolsContext.Provider>;
}

describe('<ActionsPanel />', () => {
  it('renders every action row', () => {
    const analytics = { actionTriggered: vi.fn() };
    const { container } = render(wrapContext(<ActionsPanel />, analytics));
    // Every row surfaces a data-devtools-action attribute; expect
    // at least the six known built-ins.
    const rows = container.querySelectorAll('[data-devtools-action]');
    expect(rows.length).toBeGreaterThanOrEqual(6);
  });

  it('disables actions whose optional dependency is missing', () => {
    const analytics = { actionTriggered: vi.fn() };
    const { container } = render(wrapContext(<ActionsPanel />, analytics));
    const clearCaches = container.querySelector('[data-devtools-action="clear-caches"]');
    expect(clearCaches).not.toBeNull();
    // No CACHE_MANAGER bound → button disabled.
    expect((clearCaches as HTMLButtonElement).disabled).toBe(true);
  });

  it('opens the confirmation dialog when a destructive action is pressed', () => {
    // Wire CACHE_MANAGER so the row is enabled.
    injectMocks[CACHE_MANAGER as unknown as symbol] = {
      instance: () => ({ clear: () => undefined }),
      getInstanceNames: () => [] as readonly string[],
    };
    const analytics = { actionTriggered: vi.fn() };
    const { container, getByTestId } = render(wrapContext(<ActionsPanel />, analytics));
    const btn = container.querySelector('[data-devtools-action="clear-caches"]') as HTMLElement;
    act(() => {
      fireEvent.click(btn);
    });
    // Backdrop should now be open.
    expect(getByTestId('alert-open').getAttribute('data-open')).toBe('true');
  });

  it('non-destructive actions fire immediately', () => {
    // Wire STATE_REGISTRY so `dump-state` is enabled.
    injectMocks[STATE_REGISTRY as unknown as symbol] = {
      getSnapshot: () => ({ foo: 'bar' }),
    };
    const analytics = { actionTriggered: vi.fn() };
    const { container } = render(wrapContext(<ActionsPanel />, analytics));
    const btn = container.querySelector('[data-devtools-action="dump-state"]') as HTMLElement;
    act(() => {
      fireEvent.click(btn);
    });
    expect(analytics.actionTriggered).toHaveBeenCalledWith('actions', 'dump-state');
  });
});
