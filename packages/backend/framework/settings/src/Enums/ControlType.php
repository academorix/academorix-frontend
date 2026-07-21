<?php

declare(strict_types=1);

/**
 * ControlType Enum.
 *
 * Defines all supported UI control types for setting fields. Used by
 * the `#[SettingField]` attribute to declare how a field is rendered
 * in the admin settings editor and consumed by the schema API endpoint.
 *
 * @category Enums
 *
 * @since    1.0.0
 */

namespace Stackra\Settings\Enums;

use Stackra\Enum\Attributes\Description;
use Stackra\Enum\Attributes\Label;
use Stackra\Enum\Enum;

/**
 * Supported UI control types for setting fields.
 *
 * Each case maps to a specific input widget in the admin settings editor.
 * The frontend uses this value to determine which component to render.
 */
enum ControlType: string
{
    use Enum;

    /** Single-line text input. */
    #[Label('Text')]
    #[Description('Single-line text input.')]
    case Text = 'text';

    /** Multi-line text area. */
    #[Label('Textarea')]
    #[Description('Multi-line text area.')]
    case Textarea = 'textarea';

    /** Numeric input with optional min/max. */
    #[Label('Number')]
    #[Description('Numeric input with optional min/max.')]
    case Number = 'number';

    /** Boolean toggle switch. */
    #[Label('Toggle')]
    #[Description('Boolean toggle switch.')]
    case Toggle = 'toggle';

    /** Single-select dropdown. */
    #[Label('Select')]
    #[Description('Single-select dropdown.')]
    case Select = 'select';

    /** Multi-select (tags/chips). */
    #[Label('Multiselect')]
    #[Description('Multi-select input with tags or chips.')]
    case Multiselect = 'multiselect';

    /** Color picker (OKLCH / hex). */
    #[Label('Color')]
    #[Description('Color picker supporting OKLCH and hex formats.')]
    case Color = 'color';

    /** File upload input. */
    #[Label('File')]
    #[Description('File upload input.')]
    case File = 'file';

    /** Date picker (Y-m-d). */
    #[Label('Date')]
    #[Description('Date picker in Y-m-d format.')]
    case Date = 'date';

    /** Time picker (HH:MM). */
    #[Label('Time')]
    #[Description('Time picker in HH:MM format.')]
    case Time = 'time';

    /** DateTime picker (Y-m-d H:i). */
    #[Label('Date & Time')]
    #[Description('Combined date and time picker.')]
    case Datetime = 'datetime';

    /** Timezone selector dropdown. */
    #[Label('Timezone')]
    #[Description('Timezone selector dropdown.')]
    case Timezone = 'timezone';

    /** Locale selector dropdown. */
    #[Label('Locale')]
    #[Description('Locale selector dropdown.')]
    case Locale = 'locale';

    /** Currency selector dropdown. */
    #[Label('Currency')]
    #[Description('Currency selector dropdown.')]
    case Currency = 'currency';

    /** Masked password input (never exposed in API responses). */
    #[Label('Password')]
    #[Description('Masked password input, never exposed in API responses.')]
    case Password = 'password';

    /** URL input with validation. */
    #[Label('URL')]
    #[Description('URL input with validation.')]
    case Url = 'url';

    /** Email input with validation. */
    #[Label('Email')]
    #[Description('Email input with validation.')]
    case Email = 'email';

    /** JSON editor. */
    #[Label('JSON')]
    #[Description('JSON editor for structured data.')]
    case Json = 'json';

    /** Code editor with syntax highlighting. */
    #[Label('Code')]
    #[Description('Code editor with syntax highlighting.')]
    case Code = 'code';

    /** Range slider with min/max. */
    #[Label('Slider')]
    #[Description('Range slider with min and max bounds.')]
    case Slider = 'slider';

    /** Icon picker. */
    #[Label('Icon')]
    #[Description('Icon picker for selecting icons.')]
    case Icon = 'icon';

    /** CSS value input (rem, px, shadow strings). */
    #[Label('CSS Value')]
    #[Description('CSS value input for rem, px, and shadow strings.')]
    case CssValue = 'css-value';

    /** Font family selector. */
    #[Label('Font')]
    #[Description('Font family selector.')]
    case Font = 'font';
}
