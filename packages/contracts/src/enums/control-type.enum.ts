/**
 * @file control-type.enum.ts
 * @module @stackra/contracts/enums
 * @description Built-in UI control types for setting fields.
 *
 *   Each case names the widget the admin editor renders for a field
 *   declared via `@Field({ control: ControlType.X })` (or the
 *   equivalent `control: 'x'` string in an API-driven schema).
 *
 *   The set is a superset of the two reference implementations (the
 *   Laravel `#[SettingField]` control types + the prior client-side
 *   `@Field()` control types), so any schema from either source
 *   round-trips without loss.
 */

/** Built-in UI control types recognised by the settings React renderer. */
export enum ControlType {
  /** Single-line text input. */
  Text = "text",
  /** Multi-line text area. */
  Textarea = "textarea",
  /** Numeric input with optional min / max / step. */
  Number = "number",
  /** Boolean toggle switch. */
  Toggle = "toggle",
  /** Single-select dropdown (rendered as a ComboBox per UI rules). */
  Select = "select",
  /** Multi-select input rendered as `TagGroup` fed by `ComboBox`. */
  Multiselect = "multiselect",
  /** Radio button group. */
  Radio = "radio",
  /** Segmented button group. */
  Segment = "segment",
  /** Color picker (OKLCH / hex). */
  Color = "color",
  /** File upload input (single file). */
  File = "file",
  /** File-upload input with multi / preview / size / accept config. */
  Attachment = "attachment",
  /** Date picker (`Y-m-d`). */
  Date = "date",
  /** Time picker (`HH:mm`). */
  Time = "time",
  /** Combined date + time picker. */
  Datetime = "datetime",
  /** Timezone selector. */
  Timezone = "timezone",
  /** Locale (BCP-47) selector. */
  Locale = "locale",
  /** Currency (ISO-4217) selector. */
  Currency = "currency",
  /** Masked password input; server always masks read responses. */
  Password = "password",
  /** URL input with validation. */
  Url = "url",
  /** Email input with validation. */
  Email = "email",
  /** JSON editor. */
  Json = "json",
  /** Code editor with syntax highlighting. */
  Code = "code",
  /** Range slider with min / max / step. */
  Slider = "slider",
  /** Icon picker (name-based). */
  Icon = "icon",
  /** CSS value input (rem / px / shadow strings). */
  CssValue = "css-value",
  /** Font-family selector. */
  Font = "font",
  /** Tag input (string array). */
  Tags = "tags",
  /** Ordered list input (string array). */
  List = "list",
  /** Key-value pair editor. */
  KeyValue = "keyValue",
  /** Location picker (`{ lat, lng }`). */
  Map = "map",
  /** Cron expression builder. */
  Cron = "cron",
}
