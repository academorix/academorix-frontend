<?php

declare(strict_types=1);

/**
 * LocalizationSettings — Language & Regional Configuration.
 *
 * Defines the canonical schema for localization settings within the
 * Unified Settings System. These settings control language selection,
 * locale detection, layout direction (LTR/RTL), and number formatting
 * preferences.
 *
 * Properties are organized into logical groups:
 *
 * - **Language** — Default and fallback locales, available locale list, and auto-detection.
 * - **Layout Direction** — RTL toggle and locale-based RTL mapping.
 * - **Number Formatting** — Locale-aware number formatting preferences.
 *
 * All properties use the `#[SettingField]` attribute to declare their control
 * type, validation rules, and display metadata. The `#[SettingGroup]` attribute
 * organizes fields into visual sections in the admin UI.
 *
 * @category Settings
 *
 * @since    1.0.0
 *
 * @see \Academorix\Settings\Attributes\AsSetting
 * @see \Academorix\Settings\Attributes\SettingField
 * @see \Academorix\Settings\Attributes\SettingGroup
 */

namespace Academorix\Settings\Settings;

use Spatie\LaravelSettings\Settings;
use Academorix\Settings\Attributes\AsSetting;
use Academorix\Settings\Attributes\SettingField;
use Academorix\Settings\Attributes\SettingGroup;
use Academorix\Settings\Enums\ControlType;

/**
 * Localization Settings.
 *
 * Stores language and regional configuration values scoped to the tenant
 * level with public visibility, allowing each tenant to customize their
 * own localization behavior. Public visibility ensures that locale and
 * direction data is available to unauthenticated frontend clients for
 * initial rendering.
 *
 * **Language:**
 * - `default_locale`: The primary locale used for translations and formatting.
 * - `fallback_locale`: The locale used when a translation key is missing.
 * - `available_locales`: Comma-separated list of locales offered to users.
 * - `auto_detect_locale`: Whether to detect locale from browser headers.
 *
 * **Layout Direction:**
 * - `rtl_enabled`: Whether right-to-left layout is active.
 * - `rtl_locales`: Comma-separated list of locales that trigger RTL layout.
 *
 * **Number Formatting:**
 * - `number_format_locale`: BCP 47 locale tag for number formatting (e.g., `en-US`, `de-DE`).
 */
#[AsSetting(group: 'localization', label: 'Localization', description: 'Language and regional settings.', icon: 'globe', scope: 'tenant', public: true, sortOrder: 4)]
class LocalizationSettings extends Settings
{
    // ──────────────────────────────────────────────────────────────
    //  Language
    // ──────────────────────────────────────────────────────────────

    /**
     * Default application locale.
     *
     * The primary locale used for translations, date formatting, and
     * all locale-aware operations. Accepts a BCP 47 language tag or
     * a simple two-letter ISO 639-1 code (e.g., `en`, `ar`, `fr`).
     */
    #[SettingGroup(label: 'Language', description: 'Default and fallback locales, available locale list, and auto-detection.', icon: 'languages', sortOrder: 1)]
    #[SettingField(controlType: ControlType::Text, label: 'Default Locale', validation: ['nullable', 'string', 'max:10'], sortOrder: 1, group: 'Language')]
    public string $default_locale = 'en';

    /**
     * Fallback locale.
     *
     * The locale used when a translation key is not found in the
     * default locale. Ensures the UI always displays meaningful
     * text even when translations are incomplete.
     */
    #[SettingField(controlType: ControlType::Text, label: 'Fallback Locale', validation: ['nullable', 'string', 'max:10'], sortOrder: 2, group: 'Language')]
    public string $fallback_locale = 'en';

    /**
     * Available locales.
     *
     * Comma-separated list of locale codes that are offered to users
     * in the language switcher UI. Only locales listed here will be
     * selectable by end users (e.g., `en,ar,fr,de`).
     */
    #[SettingField(controlType: ControlType::Text, label: 'Available Locales', validation: ['nullable', 'string', 'max:200'], sortOrder: 3, group: 'Language')]
    public string $available_locales = 'en,ar';

    /**
     * Automatic locale detection toggle.
     *
     * When enabled, the application attempts to detect the user's
     * preferred locale from the `Accept-Language` HTTP header on
     * first visit and sets it as the active locale if it is in the
     * available locales list.
     */
    #[SettingField(controlType: ControlType::Toggle, label: 'Auto-Detect Locale', sortOrder: 4, group: 'Language')]
    public bool $auto_detect_locale = true;

    // ──────────────────────────────────────────────────────────────
    //  Layout Direction
    // ──────────────────────────────────────────────────────────────

    /**
     * Right-to-left layout toggle.
     *
     * When enabled, the application renders in RTL mode for locales
     * listed in `rtl_locales`. The `dir` attribute on the root HTML
     * element is set to `rtl` and CSS logical properties are applied.
     */
    #[SettingGroup(label: 'Layout Direction', description: 'RTL toggle and locale-based RTL mapping.', icon: 'arrow-right-left', sortOrder: 2)]
    #[SettingField(controlType: ControlType::Toggle, label: 'RTL Enabled', sortOrder: 1, group: 'Layout Direction')]
    public bool $rtl_enabled = false;

    /**
     * RTL locale list.
     *
     * Comma-separated list of locale codes that trigger right-to-left
     * layout when the active locale matches one of these values
     * (e.g., `ar,he,fa,ur`).
     */
    #[SettingField(controlType: ControlType::Text, label: 'RTL Locales', validation: ['nullable', 'string', 'max:100'], sortOrder: 2, group: 'Layout Direction')]
    public string $rtl_locales = 'ar,he,fa,ur';

    // ──────────────────────────────────────────────────────────────
    //  Number Formatting
    // ──────────────────────────────────────────────────────────────

    /**
     * Number format locale.
     *
     * BCP 47 locale tag used by the `Intl.NumberFormat` API on the
     * frontend and PHP's `NumberFormatter` on the backend to render
     * locale-aware numeric values (e.g., `en-US` for `1,234.56`,
     * `de-DE` for `1.234,56`).
     */
    #[SettingGroup(label: 'Number Formatting', description: 'Locale-aware number formatting preferences.', icon: 'hash', sortOrder: 3)]
    #[SettingField(controlType: ControlType::Text, label: 'Number Format Locale', validation: ['nullable', 'string', 'max:20'], sortOrder: 1, group: 'Number Formatting')]
    public string $number_format_locale = 'en-US';

    /**
     * Get the Spatie Settings group identifier.
     *
     * This value is used as the database group prefix for all localization
     * setting properties (e.g., `localization.default_locale`, `localization.rtl_enabled`).
     *
     * @return string The settings group key.
     */
    public static function group(): string
    {
        return 'localization';
    }
}
