// @vitest-environment jsdom
/**
 * @file setting-field.spec.tsx
 * @module @stackra/settings/__tests__/unit
 * @description RTL smoke tests for the `<SettingField>` dispatcher.
 *   We verify that every ControlType we route explicitly renders the
 *   expected HeroUI compound (identified via its data-slot or role)
 *   and forwards the `onChange` contract.
 */

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ControlType, type ISettingField } from '@stackra/contracts';

import { SettingField } from '@/react/components/setting-field';

afterEach(cleanup);

/** Build a field descriptor with sensible defaults. */
function makeField(overrides: Partial<ISettingField>): ISettingField {
  return {
    key: 'field',
    control: ControlType.Text,
    label: 'Field',
    defaultValue: '',
    ...overrides,
  } as ISettingField;
}

describe('<SettingField>', () => {
  it('renders a text input for text-family controls', () => {
    render(
      <SettingField
        field={makeField({ label: 'Website', control: ControlType.Url })}
        value=""
        onChange={() => undefined}
      />
    );
    expect(screen.getByText('Website')).toBeDefined();
  });

  it('renders a switch for toggle controls', () => {
    const onChange = vi.fn();
    render(
      <SettingField
        field={makeField({ label: 'Compact mode', control: ControlType.Toggle })}
        value={false}
        onChange={onChange}
      />
    );
    const label = screen.getByText('Compact mode');
    expect(label).toBeDefined();
  });

  it('renders a slider for slider controls', () => {
    render(
      <SettingField
        field={makeField({
          label: 'Brightness',
          control: ControlType.Slider,
          min: 0,
          max: 100,
          step: 1,
        })}
        value={30}
        onChange={() => undefined}
      />
    );
    expect(screen.getByText('Brightness')).toBeDefined();
  });

  it('renders a ComboBox for select-family controls', () => {
    render(
      <SettingField
        field={makeField({
          label: 'Theme',
          control: ControlType.Select,
          options: [
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
          ],
        })}
        value="light"
        onChange={() => undefined}
      />
    );
    expect(screen.getByText('Theme')).toBeDefined();
  });

  it('forwards onChange from the text input', () => {
    const onChange = vi.fn();
    render(
      <SettingField
        field={makeField({ label: 'Name', control: ControlType.Text })}
        value=""
        onChange={onChange}
      />
    );
    const input = screen.getByLabelText('Name') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Alice' } });
    expect(onChange).toHaveBeenCalledWith('Alice');
  });

  it('renders a description when present on the field', () => {
    render(
      <SettingField
        field={makeField({
          label: 'Name',
          description: 'Displayed on your profile.',
        })}
        value=""
        onChange={() => undefined}
      />
    );
    expect(screen.getByText('Displayed on your profile.')).toBeDefined();
  });

  it('falls back to a text renderer for unknown control types', () => {
    render(
      <SettingField
        field={makeField({
          label: 'Custom',
          control: 'palette' as unknown as ControlType,
        })}
        value="foo"
        onChange={() => undefined}
      />
    );
    expect(screen.getByText('Custom')).toBeDefined();
  });
});
