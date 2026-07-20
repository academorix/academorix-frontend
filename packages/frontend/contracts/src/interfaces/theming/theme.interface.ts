/**
 * @file theme.interface.ts
 * @module @stackra/contracts/interfaces/theming
 * @description The canonical `ITheme` shape.
 *
 *   A theme is a full design-token bundle — colors, typography,
 *   spacing, radius, borders, shadows, motion. Every workspace
 *   package (`@stackra/theming`, `@stackra/settings`, `@stackra/sdui`,
 *   `academorix/theming`) references this exact shape; the
 *   wire payload between server and client is a JSON serialization
 *   of the same fields.
 *
 *   The `tokens` field is optional at the runtime level — built-in
 *   themes shipped by `@stackra/theming` compile their token map
 *   into CSS at build time and leave `tokens` undefined on the
 *   runtime `ITheme` (the browser reads the tokens from the CSS
 *   file via `[data-design-theme="<id>"]` selectors). Server-
 *   created custom themes always carry the full map so the
 *   `WebThemeBindings` can inject the CSS variables dynamically.
 */

/**
 * The canonical theme record.
 */
export interface ITheme {
  /**
   * Slug — the primary key. Matches Laravel's `themes.slug` column.
   * Follows the pattern `[a-z0-9-]+`.
   */
  readonly id: string;

  /** Human-readable label. Always populated. */
  readonly label: string;

  /**
   * Optional i18n key. When present, consumer code routes the label
   * through `I18N_MANAGER.t(labelKey, defaultValue: label)`.
   */
  readonly labelKey?: string;

  /** Optional longer description surfaced by pickers. */
  readonly description?: string;

  /**
   * Optional swatch hex (e.g. `'#e50914'`). Used for preview cards
   * and small color chips.
   */
  readonly color?: string;

  /** Optional preview image URL. */
  readonly previewImage?: string;

  /** Whether this theme defaults to dark mode. @default false */
  readonly isDark?: boolean;

  /**
   * Whether this is a built-in (system-shipped) theme, vs. a
   * user-created one. Admin UIs gate the "Delete" affordance on
   * this flag.
   */
  readonly isSystem?: boolean;

  /**
   * Full design-token map. Keys mirror CSS custom-property names
   * (kebab-case, no `--` prefix). Values are raw CSS values (OKLCH
   * strings, keyword values, unit values).
   *
   * OPTIONAL: built-in themes leave this undefined because their
   * tokens are compiled into CSS at build time. Server-created
   * custom themes always carry the full map.
   *
   * Common token prefixes: `color-*`, `font-*`, `text-*`,
   * `spacing-*`, `radius-*`, `border-*`, `shadow-*`, `duration-*`,
   * `ease-*`.
   */
  readonly tokens?: Readonly<Record<string, unknown>>;

  /** ISO-8601 creation timestamp from the server. */
  readonly createdAt?: string;

  /** ISO-8601 update timestamp from the server. */
  readonly updatedAt?: string;

  /**
   * Multi-tenancy discriminator. Null / undefined for single-tenant
   * apps.
   */
  readonly tenantId?: number | null;
}

/**
 * The POST-payload shape for creating a new theme. Requires the
 * fields the server can't derive on its own; everything else is
 * server-generated (id if slugged separately, timestamps, tenant).
 */
export interface IThemeInput {
  /** Slug for the new theme (must match `[a-z0-9-]+`). */
  readonly id: string;
  /** Human-readable label. */
  readonly label: string;
  /** Optional description. */
  readonly description?: string;
  /** Full design-token map. */
  readonly tokens: Readonly<Record<string, unknown>>;
  /** Optional swatch color hex. */
  readonly color?: string;
  /** Optional preview image URL. */
  readonly previewImage?: string;
  /** Whether this theme defaults to dark mode. @default false */
  readonly isDark?: boolean;
}
