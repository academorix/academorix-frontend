/**
 * @file setting-field.component.tsx
 * @module @stackra/settings/react/components/setting-field
 * @description `<SettingField>` — maps a resolved `ISettingField`
 *   descriptor to the appropriate HeroUI compound.
 *
 *   The dispatcher is deliberately small: it decides which HeroUI
 *   component to render based on `field.control` and forwards the
 *   value / onChange contract. The parent `<SettingsForm>` handles
 *   layout (visual groups, sections). Renderers for the
 *   less-common controls (`json`, `code`, `map`, `cron`, `icon`,
 *   `attachment`) fall back to `<TextField>` — apps that need a
 *   richer renderer for those types swap them out at the composite
 *   layer (a future `renderControl` prop can extend this shape).
 */

import type { JSX, ReactNode } from 'react';
import {
  ColorArea,
  ColorPicker,
  ColorSlider,
  ColorSwatch,
  ComboBox,
  DateField,
  DatePicker,
  Description,
  FieldError,
  Input,
  Label,
  ListBox,
  NumberField,
  Radio,
  RadioGroup,
  Slider,
  Switch,
  Tag,
  TagGroup,
  TextArea,
  TextField,
  TimeField,
} from '@stackra/ui/react';
import { ControlType, type ISettingField, type ISettingFieldOption } from '@stackra/contracts';

import type { ISettingFieldProps } from './setting-field.interface';

/**
 * Render a single setting field by its resolved descriptor.
 *
 * The dispatcher chooses the HeroUI compound based on `field.control`.
 * Every branch preserves the same value / onChange contract so the
 * parent form component stays uniform.
 *
 * @example
 * ```tsx
 * <SettingField
 *   field={fieldDescriptor}
 *   value={values[fieldDescriptor.key]}
 *   onChange={(v) => set(fieldDescriptor.key, v)}
 * />
 * ```
 */
export function SettingField(props: ISettingFieldProps): JSX.Element {
  const { field } = props;

  switch (field.control) {
    case ControlType.Toggle:
      return <ToggleRenderer {...props} />;
    case ControlType.Textarea:
      return <TextareaRenderer {...props} />;
    case ControlType.Number:
      return <NumberRenderer {...props} />;
    case ControlType.Slider:
      return <SliderRenderer {...props} />;
    case ControlType.Select:
    case ControlType.Locale:
    case ControlType.Timezone:
    case ControlType.Currency:
    case ControlType.Font:
    case ControlType.Icon:
    case ControlType.CssValue:
      return <ComboBoxRenderer {...props} />;
    case ControlType.Multiselect:
    case ControlType.Tags:
      return <TagsRenderer {...props} />;
    case ControlType.Radio:
    case ControlType.Segment:
      return <RadioRenderer {...props} />;
    case ControlType.Color:
      return <ColorRenderer {...props} />;
    case ControlType.Date:
      return <DateRenderer {...props} />;
    case ControlType.Time:
      return <TimeRenderer {...props} />;
    case ControlType.Datetime:
      return <DateTimeRenderer {...props} />;
    case ControlType.Password:
    case ControlType.Url:
    case ControlType.Email:
    case ControlType.Text:
      return <TextRenderer {...props} />;
    default:
      // Unknown control types (custom app strings, or types like
      // `attachment` / `map` / `cron` we don't ship a renderer for
      // yet) fall back to a plain text input so the field is at
      // least editable. Apps that need a richer renderer can shadow
      // this dispatcher.
      return <TextRenderer {...props} />;
  }
}

// ══════════════════════════════════════════════════════════════════════
// Renderers — one per control family
// ══════════════════════════════════════════════════════════════════════

function ToggleRenderer(props: ISettingFieldProps): JSX.Element {
  const { field, value, onChange, isDisabled } = props;
  const isSelected = Boolean(value);
  return (
    <Switch
      className={props.className}
      isDisabled={isDisabled || field.readOnly}
      isSelected={isSelected}
      onChange={onChange}
    >
      <Switch.Content>
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
        {field.label}
      </Switch.Content>
      {renderDescriptionOrError(field)}
    </Switch>
  );
}

function TextRenderer(props: ISettingFieldProps): JSX.Element {
  const { field, value, onChange, isDisabled, isReadOnly } = props;
  const inputType = mapTextInputType(field.control);
  return (
    <TextField
      className={props.className}
      isDisabled={isDisabled}
      isReadOnly={isReadOnly ?? field.readOnly}
      isRequired={hasRequiredRule(field)}
      name={field.key}
      value={coerceString(value)}
      onChange={onChange}
    >
      <Label>{field.label}</Label>
      <Input placeholder={field.placeholder} type={inputType} />
      {renderDescriptionOrError(field)}
    </TextField>
  );
}

function TextareaRenderer(props: ISettingFieldProps): JSX.Element {
  const { field, value, onChange, isDisabled, isReadOnly } = props;
  return (
    <TextField
      className={props.className}
      isDisabled={isDisabled}
      isReadOnly={isReadOnly ?? field.readOnly}
      isRequired={hasRequiredRule(field)}
      name={field.key}
      value={coerceString(value)}
      onChange={onChange}
    >
      <Label>{field.label}</Label>
      <TextArea placeholder={field.placeholder} rows={4} />
      {renderDescriptionOrError(field)}
    </TextField>
  );
}

function NumberRenderer(props: ISettingFieldProps): JSX.Element {
  const { field, value, onChange, isDisabled, isReadOnly } = props;
  return (
    <NumberField
      className={props.className}
      isDisabled={isDisabled}
      isReadOnly={isReadOnly ?? field.readOnly}
      isRequired={hasRequiredRule(field)}
      maxValue={field.max}
      minValue={field.min}
      name={field.key}
      step={field.step}
      value={coerceNumber(value)}
      onChange={onChange}
    >
      <Label>{field.label}</Label>
      <NumberField.Group>
        <NumberField.DecrementButton />
        <NumberField.Input />
        <NumberField.IncrementButton />
      </NumberField.Group>
      {renderDescriptionOrError(field)}
    </NumberField>
  );
}

function SliderRenderer(props: ISettingFieldProps): JSX.Element {
  const { field, value, onChange, isDisabled } = props;
  return (
    <Slider
      className={props.className}
      isDisabled={isDisabled || field.readOnly}
      maxValue={field.max ?? 100}
      minValue={field.min ?? 0}
      step={field.step ?? 1}
      value={coerceNumber(value) ?? 0}
      onChange={(next) => onChange(Array.isArray(next) ? next[0] : next)}
    >
      <Label>{field.label}</Label>
      <Slider.Output />
      <Slider.Track>
        <Slider.Fill />
        <Slider.Thumb />
      </Slider.Track>
    </Slider>
  );
}

function ComboBoxRenderer(props: ISettingFieldProps): JSX.Element {
  const { field, value, onChange, isDisabled, isReadOnly } = props;
  // Per `.kiro/steering/ui-components.md`, ComboBox beats Select for
  // every single-choice dropdown — the filterable input scales as
  // the option list grows.
  const options = normalizeOptions(field.options);
  const selectedKey = coerceKey(value);
  return (
    <ComboBox
      className={props.className}
      isDisabled={isDisabled || field.readOnly}
      isReadOnly={isReadOnly}
      isRequired={hasRequiredRule(field)}
      menuTrigger="focus"
      name={field.key}
      selectedKey={selectedKey ?? null}
      onSelectionChange={(next) => onChange(next)}
    >
      <Label>{field.label}</Label>
      <ComboBox.InputGroup>
        <Input placeholder={field.placeholder} />
        <ComboBox.Trigger />
      </ComboBox.InputGroup>
      {renderDescriptionOrError(field)}
      <ComboBox.Popover>
        <ListBox>
          {options.map((option) => (
            <ListBox.Item
              key={String(option.value)}
              id={String(option.value)}
              textValue={option.label}
            >
              {option.label}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </ComboBox.Popover>
    </ComboBox>
  );
}

function TagsRenderer(props: ISettingFieldProps): JSX.Element {
  const { field, value, onChange, isDisabled } = props;
  const selected = coerceStringArray(value);
  const options = normalizeOptions(field.options);
  // TagGroup drives multi-selection when option list is known; for
  // free-form tag entry apps can shadow this renderer.
  // TagGroup itself doesn't accept `isDisabled` — we express the
  // disabled state via `disabledKeys` (every option is disabled).
  const disabledKeys =
    isDisabled || field.readOnly ? new Set(options.map((o) => String(o.value))) : undefined;
  return (
    <TagGroup
      className={props.className}
      disabledKeys={disabledKeys}
      selectedKeys={new Set(selected)}
      selectionMode="multiple"
      onSelectionChange={(keys) => {
        const next =
          keys === 'all'
            ? options.map((o) => String(o.value))
            : Array.from(keys).map((k) => String(k));
        onChange(next);
      }}
    >
      <Label>{field.label}</Label>
      <TagGroup.List>
        {options.map((option) => (
          <Tag key={String(option.value)} id={String(option.value)}>
            {option.label}
          </Tag>
        ))}
      </TagGroup.List>
      {renderDescriptionOrError(field)}
    </TagGroup>
  );
}

function RadioRenderer(props: ISettingFieldProps): JSX.Element {
  const { field, value, onChange, isDisabled, isReadOnly } = props;
  const options = normalizeOptions(field.options);
  return (
    <RadioGroup
      className={props.className}
      isDisabled={isDisabled || field.readOnly}
      isReadOnly={isReadOnly}
      isRequired={hasRequiredRule(field)}
      name={field.key}
      value={coerceString(value)}
      onChange={onChange}
    >
      <Label>{field.label}</Label>
      {options.map((option) => (
        <Radio key={String(option.value)} value={String(option.value)}>
          <Radio.Content>
            <Radio.Control>
              <Radio.Indicator />
            </Radio.Control>
            {option.label}
          </Radio.Content>
        </Radio>
      ))}
      {renderDescriptionOrError(field)}
    </RadioGroup>
  );
}

function ColorRenderer(props: ISettingFieldProps): JSX.Element {
  const { field, value: rawValue, onChange, isDisabled } = props;
  return (
    <ColorPicker
      value={coerceString(rawValue) || '#000000'}
      onChange={(color) => onChange(color.toString('hex'))}
    >
      <ColorPicker.Trigger>
        <ColorSwatch size="lg" />
        <Label>{field.label}</Label>
      </ColorPicker.Trigger>
      <ColorPicker.Popover>
        <ColorArea
          aria-label={field.label}
          colorSpace="hsb"
          xChannel="saturation"
          yChannel="brightness"
        >
          <ColorArea.Thumb />
        </ColorArea>
        <ColorSlider
          aria-label={`${field.label} hue`}
          channel="hue"
          className="gap-1 px-1"
          colorSpace="hsb"
          isDisabled={isDisabled}
        >
          <ColorSlider.Track>
            <ColorSlider.Thumb />
          </ColorSlider.Track>
        </ColorSlider>
      </ColorPicker.Popover>
    </ColorPicker>
  );
}

function DateRenderer(props: ISettingFieldProps): JSX.Element {
  const { field, onChange, isDisabled, isReadOnly } = props;
  // DatePicker expects a `DateValue` from `@internationalized/date` —
  // to keep the settings package peer-free of that dep we pass the
  // string through and let the caller handle parsing if they need
  // richer date interactions. The field still renders as a
  // segmented input.
  return (
    <DatePicker
      className={props.className}
      isDisabled={isDisabled || field.readOnly}
      isReadOnly={isReadOnly}
      name={field.key}
      onChange={(next) => onChange(next ? String(next) : null)}
    >
      <Label>{field.label}</Label>
      <DateField.Group fullWidth>
        <DateField.Input>{(segment) => <DateField.Segment segment={segment} />}</DateField.Input>
        <DateField.Suffix>
          <DatePicker.Trigger>
            <DatePicker.TriggerIndicator />
          </DatePicker.Trigger>
        </DateField.Suffix>
      </DateField.Group>
      {renderDescriptionOrError(field)}
    </DatePicker>
  );
}

function TimeRenderer(props: ISettingFieldProps): JSX.Element {
  const { field, isDisabled, isReadOnly, onChange } = props;
  return (
    <TimeField
      className={props.className}
      isDisabled={isDisabled || field.readOnly}
      isReadOnly={isReadOnly}
      name={field.key}
      onChange={(next) => onChange(next ? String(next) : null)}
    >
      <Label>{field.label}</Label>
      <TimeField.Group>
        <TimeField.Input>{(segment) => <TimeField.Segment segment={segment} />}</TimeField.Input>
      </TimeField.Group>
      {renderDescriptionOrError(field)}
    </TimeField>
  );
}

function DateTimeRenderer(props: ISettingFieldProps): JSX.Element {
  // For datetime we render DatePicker with a `granularity="minute"`
  // hint. Callers that need a distinct visual for date+time can shadow
  // this branch.
  const { field, isDisabled, isReadOnly, onChange } = props;
  return (
    <DatePicker
      className={props.className}
      granularity="minute"
      isDisabled={isDisabled || field.readOnly}
      isReadOnly={isReadOnly}
      name={field.key}
      onChange={(next) => onChange(next ? String(next) : null)}
    >
      <Label>{field.label}</Label>
      <DateField.Group fullWidth>
        <DateField.Input>{(segment) => <DateField.Segment segment={segment} />}</DateField.Input>
        <DateField.Suffix>
          <DatePicker.Trigger>
            <DatePicker.TriggerIndicator />
          </DatePicker.Trigger>
        </DateField.Suffix>
      </DateField.Group>
      {renderDescriptionOrError(field)}
    </DatePicker>
  );
}

// ══════════════════════════════════════════════════════════════════════
// Helpers
// ══════════════════════════════════════════════════════════════════════

/** Emit either the description or the first validation error slot. */
function renderDescriptionOrError(field: ISettingField): ReactNode {
  if (field.description) {
    return <Description>{field.description}</Description>;
  }
  // Every branch renders the FieldError slot so downstream validation
  // callers can supply a validation error via context — HeroUI wires
  // FieldError automatically when the parent field is `isInvalid`.
  return <FieldError />;
}

/** Coerce whatever the store returned into a string. */
function coerceString(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return '';
  return String(value);
}

/** Coerce into a number or undefined for `NumberField`. */
function coerceNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

/** Coerce into the `Key` type ComboBox expects. */
function coerceKey(value: unknown): string | number | undefined {
  if (typeof value === 'string' || typeof value === 'number') return value;
  return undefined;
}

/** Coerce an unknown into a `string[]` for tag / multiselect fields. */
function coerceStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item));
}

/** Normalise option list — the descriptor may carry no options. */
function normalizeOptions(options: ISettingField['options']): readonly ISettingFieldOption[] {
  return options ?? [];
}

/** Read the field's validation for a `required` rule. */
function hasRequiredRule(field: ISettingField): boolean {
  return (field.validation ?? []).some((rule) => rule.type === 'required');
}

/** Text-input HTML type inferred from a text-family control. */
function mapTextInputType(control: string): 'text' | 'password' | 'url' | 'email' {
  switch (control) {
    case ControlType.Password:
      return 'password';
    case ControlType.Url:
      return 'url';
    case ControlType.Email:
      return 'email';
    default:
      return 'text';
  }
}
