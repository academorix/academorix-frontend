/**
 * @file settings-form.component.tsx
 * @module @stackra/settings/react/components/settings-form
 * @description `<SettingsForm>` — schema-driven form for one settings
 *   group.
 *
 *   Reads the group's resolved definition from the registry, binds
 *   the reactive values through `useSettings`, and renders each
 *   field through the `<SettingField>` dispatcher. Visual sub-groups
 *   from `@Group()` become fieldsets; `@Section()` dividers render as
 *   inline headings above the referenced field.
 *
 *   Composition rules per `.kiro/steering/ui-components.md`:
 *   - Every visual primitive comes from `@stackra/ui/react` (HeroUI).
 *   - Only Tailwind LAYOUT utilities (`flex`, `gap-*`, `mt-*`,
 *     `w-full`) — no bespoke class names.
 */

import { useCallback, useMemo, type JSX, type ReactNode } from 'react';
import { Fieldset, Separator, Typography } from '@stackra/ui/react';
import type { ISettingDefinition, ISettingField } from '@stackra/contracts';

import { useSettings } from '@/core/hooks/use-settings';
import { useSettingsSchema } from '@/core/hooks/use-settings-schema';
import { SettingField } from '@/react/components/setting-field';

import type { ISettingsFormProps } from './settings-form.interface';

/**
 * Render every field in a settings group as a form.
 *
 * @example DTO form
 * ```tsx
 * <SettingsForm group={DisplaySettings} />
 * ```
 *
 * @example API-driven group
 * ```tsx
 * <SettingsForm group="theme" />
 * ```
 *
 * @example Custom field renderer for a bespoke control type
 * ```tsx
 * <SettingsForm
 *   group={ThemeSettings}
 *   renderField={({ field, value, onChange }) =>
 *     field.control === 'palette' ? (
 *       <MyPaletteEditor value={value} onChange={onChange} />
 *     ) : undefined
 *   }
 * />
 * ```
 */
export function SettingsForm(props: ISettingsFormProps): JSX.Element | null {
  const { group, fieldFilter, renderField, renderHeader, className, isReadOnly, isDisabled } =
    props;

  // Resolve the definition from the registry. `useSettingsSchema`
  // re-renders when a schema-loaded event fires, so a form declared
  // against a not-yet-registered group renders `null` until the
  // schema arrives.
  const schema = useSettingsSchema();
  const definition = useMemo<ISettingDefinition | undefined>(
    () =>
      typeof group === 'string'
        ? schema.find((d) => d.key === group)
        : (schema.find((d) => d.dto === group) as ISettingDefinition | undefined),
    [schema, group]
  );

  // Register the settings service subscription against the resolved
  // group. Fall back to the group-key form when a DTO wasn't
  // supplied.
  const groupKey = definition?.key ?? (typeof group === 'string' ? group : undefined);

  // Hook must be called unconditionally; when the definition hasn't
  // arrived yet we pass a placeholder key and drop the returned
  // values below.
  const settings = useSettings<Record<string, unknown>>(groupKey ?? '__stackra_settings_pending__');

  const onChangeFor = useCallback(
    (field: ISettingField) => (next: unknown) => {
      if (!groupKey) return;
      settings.set(field.key, next);
    },
    [groupKey, settings]
  );

  if (!definition || !groupKey) {
    return null;
  }

  const fields = definition.fields.filter((field) => (fieldFilter ? fieldFilter(field) : true));

  // Partition fields by their `group` reference so visual sub-groups
  // render as their own `<Fieldset>`. Fields without a `group`
  // reference render at the root level, in declaration order.
  const rootFields = fields.filter((f) => !f.group);
  const groupedFields = groupFieldsByVisualGroup(fields, definition);

  return (
    <div className={className ?? 'flex flex-col gap-6'}>
      {renderHeader ? renderHeader(definition) : <DefaultHeader definition={definition} />}

      {rootFields.length > 0 ? (
        <div className="flex flex-col gap-4">
          {rootFields.map((field) => (
            <FieldRow
              key={field.key}
              definition={definition}
              field={field}
              isDisabled={isDisabled}
              isReadOnly={isReadOnly}
              renderField={renderField}
              value={settings.values[field.key]}
              onChange={onChangeFor(field)}
            />
          ))}
        </div>
      ) : null}

      {Array.from(groupedFields.entries()).map(([groupIdent, entries]) => (
        <VisualGroupSection
          key={groupIdent}
          definition={definition}
          fields={entries.fields}
          heading={entries.heading}
          isDisabled={isDisabled}
          isReadOnly={isReadOnly}
          renderField={renderField}
          settings={settings}
        />
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// Internal components
// ══════════════════════════════════════════════════════════════════════

/** Default header — group label + optional description. */
function DefaultHeader({ definition }: { definition: ISettingDefinition }): JSX.Element {
  return (
    <div className="flex flex-col gap-1">
      <Typography type="h4">{definition.label}</Typography>
      {definition.description ? (
        <Typography color="muted" type="body-sm">
          {definition.description}
        </Typography>
      ) : null}
    </div>
  );
}

/**
 * One row — optional section divider then the dispatched field.
 */
function FieldRow(props: {
  readonly field: ISettingField;
  readonly definition: ISettingDefinition;
  readonly value: unknown;
  readonly onChange: (next: unknown) => void;
  readonly isDisabled?: boolean;
  readonly isReadOnly?: boolean;
  readonly renderField?: ISettingsFormProps['renderField'];
}): JSX.Element {
  const { field, definition, value, onChange, isDisabled, isReadOnly, renderField } = props;
  const section = definition.sections?.[field.key];
  const rendered = renderField?.({ field, value, onChange });

  return (
    <div className="flex flex-col gap-2">
      {section ? (
        <div className="flex flex-col gap-1">
          <Separator />
          <Typography type="body-sm" weight="semibold">
            {section.label}
          </Typography>
          {section.description ? (
            <Typography color="muted" type="body-xs">
              {section.description}
            </Typography>
          ) : null}
        </div>
      ) : null}

      {rendered ?? (
        <SettingField
          field={field}
          isDisabled={isDisabled}
          isReadOnly={isReadOnly}
          value={value}
          onChange={onChange}
        />
      )}
    </div>
  );
}

/**
 * Render one visual group (`@Group()` sub-section) as a `<Fieldset>`.
 */
function VisualGroupSection(props: {
  readonly heading: { readonly label: string; readonly description?: string };
  readonly fields: readonly ISettingField[];
  readonly definition: ISettingDefinition;
  readonly settings: ReturnType<typeof useSettings<Record<string, unknown>>>;
  readonly isDisabled?: boolean;
  readonly isReadOnly?: boolean;
  readonly renderField?: ISettingsFormProps['renderField'];
}): JSX.Element {
  const { heading, fields, definition, settings, isDisabled, isReadOnly, renderField } = props;

  return (
    <Fieldset className="flex flex-col gap-4">
      <Fieldset.Legend>{heading.label}</Fieldset.Legend>
      {heading.description ? (
        <Typography color="muted" type="body-sm">
          {heading.description}
        </Typography>
      ) : null}
      <div className="flex flex-col gap-4">
        {fields.map((field) => (
          <FieldRow
            key={field.key}
            definition={definition}
            field={field}
            isDisabled={isDisabled}
            isReadOnly={isReadOnly}
            renderField={renderField}
            value={settings.values[field.key]}
            onChange={(next) => settings.set(field.key, next)}
          />
        ))}
      </div>
    </Fieldset>
  );
}

// ══════════════════════════════════════════════════════════════════════
// Helpers
// ══════════════════════════════════════════════════════════════════════

interface IGroupedFieldsEntry {
  readonly heading: { readonly label: string; readonly description?: string };
  readonly fields: ISettingField[];
}

/**
 * Bucket the fields by their `group` reference. Preserves the visual
 * group's declared order.
 */
function groupFieldsByVisualGroup(
  fields: readonly ISettingField[],
  definition: ISettingDefinition
): Map<string, IGroupedFieldsEntry> {
  const grouped = new Map<string, IGroupedFieldsEntry>();

  for (const field of fields) {
    if (!field.group) continue;
    const heading = definition.groups.find((g) => g.key === field.group);
    if (!heading) continue;

    const entry = grouped.get(field.group) ?? {
      heading: { label: heading.label, description: heading.description },
      fields: [] as ISettingField[],
    };
    entry.fields.push(field);
    grouped.set(field.group, entry);
  }

  // Ensure Map iteration order matches the definition's `groups`
  // ordering (which the registry already sorted by `order`).
  const sorted = new Map<string, IGroupedFieldsEntry>();
  for (const visual of definition.groups) {
    const entry = grouped.get(visual.key);
    if (entry) sorted.set(visual.key, entry);
  }
  return sorted;
}

// Ensure the Typography / Fieldset imports don't accidentally get
// dropped by an aggressive tree-shaker in a downstream build — the
// TSX above uses them but static tooling can't always tell.
export const _forceKeepImports: ReactNode = null;
