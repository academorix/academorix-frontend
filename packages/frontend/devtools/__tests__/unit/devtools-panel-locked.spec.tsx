// @vitest-environment jsdom
/**
 * @file devtools-panel-locked.spec.tsx
 * @module @stackra/devtools/tests/unit
 * @description Tests for the web `<DevtoolsPanelLocked />` state.
 */

import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import type { IDevtoolsAuthGate } from '@stackra/contracts';

vi.mock('@stackra/ui/react', () => {
  function Card({ children }: { readonly children?: ReactNode }) {
    return <div data-testid="card">{children}</div>;
  }
  Card.Header = ({ children }: { readonly children?: ReactNode }) => (
    <div data-testid="card-header">{children}</div>
  );
  Card.Title = ({ children }: { readonly children?: ReactNode }) => (
    <h2 data-testid="card-title">{children}</h2>
  );
  Card.Content = ({ children }: { readonly children?: ReactNode }) => <div>{children}</div>;
  Card.Footer = ({ children }: { readonly children?: ReactNode }) => (
    <div data-testid="card-footer">{children}</div>
  );
  function Button({
    children,
    onPress,
    isDisabled,
  }: {
    readonly children?: ReactNode;
    readonly onPress?: () => void;
    readonly isDisabled?: boolean;
  }) {
    return (
      <button type="button" disabled={isDisabled} onClick={onPress}>
        {children}
      </button>
    );
  }
  return { Button, Card };
});

vi.mock('@stackra/ui/icons/heroicon/outline', () => ({
  LockClosedIcon: () => <span data-testid="lock-icon" />,
}));

import { DevtoolsPanelLocked } from '@/react/components/devtools-panel-locked';

afterEach(() => {
  cleanup();
});

const GATE: IDevtoolsAuthGate = {
  ability: 'view-sensitive',
  message: 'This panel is sensitive.',
};

describe('<DevtoolsPanelLocked />', () => {
  it('renders the locked screen with the required-ability chip', () => {
    const { getByTestId, getByText } = render(
      <DevtoolsPanelLocked gate={GATE} reason="forbidden" />
    );
    expect(getByTestId('lock-icon')).toBeDefined();
    expect(getByText('This panel is sensitive.')).toBeDefined();
    // The card title varies by reason — forbidden shows the
    // "You don't have permission" copy.
    expect(getByTestId('card-title').textContent).toMatch(/permission/i);
  });

  it('shows the Sign in button when unauthenticated', () => {
    const { getByText } = render(<DevtoolsPanelLocked gate={GATE} reason="unauthenticated" />);
    expect(getByText('Sign in')).toBeDefined();
  });

  it('does not show the Sign in button when forbidden', () => {
    const { queryByText } = render(<DevtoolsPanelLocked gate={GATE} reason="forbidden" />);
    expect(queryByText('Sign in')).toBeNull();
  });
});
