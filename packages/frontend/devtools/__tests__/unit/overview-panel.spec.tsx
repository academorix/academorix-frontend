// @vitest-environment jsdom
/**
 * @file overview-panel.spec.tsx
 * @module @stackra/devtools/tests/unit
 * @description Tests for the built-in web `<OverviewPanel />`.
 */

import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';

vi.mock('@stackra/ui/react', () => {
  const Div = ({ children }: { readonly children?: ReactNode }) => <div>{children}</div>;
  function Card({
    children,
    className,
  }: {
    readonly children?: ReactNode;
    readonly className?: string;
  }) {
    return (
      <div data-testid="card" className={className}>
        {children}
      </div>
    );
  }
  Card.Header = Div;
  Card.Content = Div;
  Card.Title = ({ children }: { readonly children?: ReactNode }) => (
    <h3 data-testid="card-title">{children}</h3>
  );
  Card.Description = ({ children }: { readonly children?: ReactNode }) => (
    <p data-testid="card-desc">{children}</p>
  );
  function Chip({ children }: { readonly children?: ReactNode }) {
    return <div data-testid="chip">{children}</div>;
  }
  Chip.Label = ({ children }: { readonly children?: ReactNode }) => (
    <span data-testid="chip-label">{children}</span>
  );
  function Button({ children }: { readonly children?: ReactNode }) {
    return <button type="button">{children}</button>;
  }
  return { Button, Card, Chip };
});

vi.mock('@stackra/ui/icons/heroicon/outline', () => {
  const Stub = () => <span />;
  return { ArrowPathIcon: Stub, BookOpenIcon: Stub };
});

// Stub the inspector hook to avoid the collectAll re-render loop.
vi.mock('@/react/hooks/use-devtools-inspector.hook', () => ({
  useDevtoolsInspector: () => ({
    enabled: false,
    setEnabled: vi.fn(),
    toggle: vi.fn(),
    regions: [],
  }),
}));

import { DevtoolsContext } from '@/react/contexts/devtools.context';
import type { IDevtoolsContextValue } from '@/react/contexts/devtools-context-value.interface';
import { DevtoolsFrameStateService } from '@/core/services/devtools-frame-state.service';
import { OverviewPanel } from '@/react/components/overview-panel';
import { createMockDevtoolsPanel } from '@/testing/create-mock-devtools-panel.util';
import { mergeConfig } from '@/core/utils/merge-config.util';
import { MockDevtoolsInspectorRegistry } from '@/testing/mock-devtools-inspector-registry';
import { MockDevtoolsPanelsRegistry } from '@/testing/mock-devtools-panels-registry';

afterEach(() => {
  cleanup();
});

/** Build a context with a two-panel registry. */
function wrapContext(children: ReactNode): React.JSX.Element {
  const registry = new MockDevtoolsPanelsRegistry();
  registry.register(createMockDevtoolsPanel({ id: 'a', category: 'pinned' }));
  registry.register(createMockDevtoolsPanel({ id: 'b', category: 'app' }));
  const frameState = new DevtoolsFrameStateService(mergeConfig());
  frameState.onModuleInit();
  const value: IDevtoolsContextValue = {
    config: mergeConfig(),
    panels: registry,
    inspector: new MockDevtoolsInspectorRegistry(),
    frameState,
    analytics: {} as unknown as IDevtoolsContextValue['analytics'],
    mountedAt: Date.now() - 5000,
  };
  return <DevtoolsContext.Provider value={value}>{children}</DevtoolsContext.Provider>;
}

describe('<OverviewPanel />', () => {
  it('renders the metadata cards', () => {
    const { getAllByTestId } = render(wrapContext(<OverviewPanel />));
    // Four stat cards: Panels, Inspector sources, Session uptime,
    // Categories.
    expect(getAllByTestId('card').length).toBeGreaterThanOrEqual(4);
  });

  it('surfaces the registered panel count', () => {
    const { container } = render(wrapContext(<OverviewPanel />));
    // The panel count card renders the abbreviated total (2 panels
    // → "2").
    const titles = Array.from(container.querySelectorAll('[data-testid="card-title"]'));
    // At least one title equals "2" (the panel count).
    expect(titles.some((el) => el.textContent === '2')).toBe(true);
  });
});
