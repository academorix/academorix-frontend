<?php

declare(strict_types=1);

/**
 * GeneralSettings — Core Application Configuration.
 *
 * Defines the canonical schema for general application settings within the
 * Unified Settings System. These settings control fundamental application
 * behavior including identity, date/time formatting, currency display,
 * pagination defaults, upload limits, and maintenance mode.
 *
 * Properties are organized into logical groups:
 *
 * - **Application** — App name, URL, and timezone.
 * - **Date & Time** — Date, time, and datetime display formats.
 * - **Currency & Numbers** — Currency code, symbol, position, and number separators.
 * - **Pagination & Uploads** — Default page size and upload size limits.
 * - **Maintenance** — Maintenance mode toggle and visitor message.
 *
 * All properties use the `#[SettingField]` attribute to declare their control
 * type, validation rules, and display metadata. The `#[SettingGroup]` attribute
 * organizes fields into visual sections in the admin UI.
 *
 * @category Settings
 *
 * @since    1.0.0
 *
 * @see \Stackra\Settings\Attributes\AsSetting
 * @see \Stackra\Settings\Attributes\SettingField
 * @see \Stackra\Settings\Attributes\SettingGroup
 */

namespace Stackra\Settings\Settings;

use Spatie\LaravelSettings\Settings;
use Stackra\Settings\Attributes\AsSetting;
use Stackra\Settings\Attributes\SettingField;
use Stackra\Settings\Attributes\SettingGroup;
use Stackra\Settings\Enums\ControlType;
use Stackra\Settings\Enums\CurrencyPosition;

/**
 * General Application Settings.
 *
 * Stores core configuration values that affect application-wide behavior.
 * Scoped to the tenant level, allowing each tenant to customize their
 * own application identity, formatting preferences, and operational modes.
 *
 * **Application:**
 * - `app_name`: Display name used in headers, emails, and branding.
 * - `app_url`: Base URL for the application instance.
 * - `timezone`: Default timezone for date/time operations.
 *
 * **Date & Time:**
 * - `date_format`: PHP date format string for date-only display.
 * - `time_format`: PHP date format string for time-only display.
 * - `datetime_format`: PHP date format string for combined date and time display.
 *
 * **Currency & Numbers:**
 * - `currency`: ISO 4217 currency code (e.g., USD, EUR, GBP).
 * - `currency_symbol`: Currency symbol for display (e.g., $, €, £).
 * - `currency_position`: Whether the symbol appears before or after the amount.
 * - `decimal_separator`: Character used as the decimal point.
 * - `thousands_separator`: Character used as the thousands grouping separator.
 *
 * **Pagination & Uploads:**
 * - `pagination_per_page`: Default number of items per page in list views.
 * - `max_upload_size_mb`: Maximum allowed file upload size in megabytes.
 *
 * **Maintenance:**
 * - `maintenance_mode`: Whether the application is in maintenance mode.
 * - `maintenance_message`: Message displayed to visitors during maintenance.
 */
#[AsSetting(group: 'general', label: 'General', description: 'Core application settings.', icon: 'settings', scope: 'tenant', sortOrder: 1)]
class GeneralSettings extends Settings
{
    // ──────────────────────────────────────────────────────────────
    //  Application
    // ──────────────────────────────────────────────────────────────

    /**
     * Application display name.
     *
     * Used in the UI header, page titles, email templates, and any
     * branding context that references the application by name.
     */
    #[SettingGroup(label: 'Application', description: 'Core application identity and timezone.', icon: 'app-window', sortOrder: 1)]
    #[SettingField(controlType: ControlType::Text, label: 'App Name', validation: ['nullable', 'string', 'max:100'], sortOrder: 1, group: 'Application')]
    public string $app_name = 'Stackra';

    /**
     * Application base URL.
     *
     * The canonical URL for this application instance. Used for generating
     * absolute links in emails, API responses, and external integrations.
     */
    #[SettingField(controlType: ControlType::Url, label: 'App URL', validation: ['nullable', 'string', 'url', 'max:500'], sortOrder: 2, group: 'Application')]
    public string $app_url = '';

    /**
     * Default application timezone.
     *
     * Used as the default timezone for date/time formatting and display
     * when no user-specific timezone preference is set. Accepts any
     * valid PHP timezone identifier (e.g., `UTC`, `America/New_York`).
     */
    #[SettingField(controlType: ControlType::Timezone, label: 'Timezone', validation: ['nullable', 'string', 'max:50'], sortOrder: 3, group: 'Application')]
    public string $timezone = 'UTC';

    // ──────────────────────────────────────────────────────────────
    //  Date & Time
    // ──────────────────────────────────────────────────────────────

    /**
     * Date display format.
     *
     * PHP date format string used for rendering date-only values
     * throughout the application (e.g., `Y-m-d`, `m/d/Y`, `d.m.Y`).
     */
    #[SettingGroup(label: 'Date & Time', description: 'Date, time, and datetime display formats.', icon: 'calendar', sortOrder: 2)]
    #[SettingField(controlType: ControlType::Text, label: 'Date Format', validation: ['nullable', 'string', 'max:20'], sortOrder: 1, group: 'Date & Time')]
    public string $date_format = 'Y-m-d';

    /**
     * Time display format.
     *
     * PHP date format string used for rendering time-only values
     * throughout the application (e.g., `H:i`, `h:i A`, `H:i:s`).
     */
    #[SettingField(controlType: ControlType::Text, label: 'Time Format', validation: ['nullable', 'string', 'max:20'], sortOrder: 2, group: 'Date & Time')]
    public string $time_format = 'H:i';

    /**
     * Combined date and time display format.
     *
     * PHP date format string used for rendering full datetime values
     * (e.g., `Y-m-d H:i`, `m/d/Y h:i A`).
     */
    #[SettingField(controlType: ControlType::Text, label: 'Datetime Format', validation: ['nullable', 'string', 'max:40'], sortOrder: 3, group: 'Date & Time')]
    public string $datetime_format = 'Y-m-d H:i';

    // ──────────────────────────────────────────────────────────────
    //  Currency & Numbers
    // ──────────────────────────────────────────────────────────────

    /**
     * ISO 4217 currency code.
     *
     * Three-letter currency code used for monetary value formatting
     * and locale-aware number display (e.g., `USD`, `EUR`, `GBP`).
     */
    #[SettingGroup(label: 'Currency & Numbers', description: 'Currency display and number formatting preferences.', icon: 'dollar-sign', sortOrder: 3)]
    #[SettingField(controlType: ControlType::Text, label: 'Currency', validation: ['nullable', 'string', 'max:3'], sortOrder: 1, group: 'Currency & Numbers')]
    public string $currency = 'USD';

    /**
     * Currency display symbol.
     *
     * The symbol rendered alongside monetary values (e.g., `$`, `€`, `£`).
     * Combined with `currency_position` to determine placement.
     */
    #[SettingField(controlType: ControlType::Text, label: 'Currency Symbol', validation: ['nullable', 'string', 'max:5'], sortOrder: 2, group: 'Currency & Numbers')]
    public string $currency_symbol = '$';

    /**
     * Currency symbol position relative to the amount.
     *
     * Determines whether the currency symbol appears before or after
     * the numeric value. Accepted values: `before`, `after`.
     */
    #[SettingField(controlType: ControlType::Select, label: 'Currency Position', validation: ['nullable', 'string', 'in:before,after'], sortOrder: 3, group: 'Currency & Numbers', options: CurrencyPosition::class)]
    public string $currency_position = 'before';

    /**
     * Decimal separator character.
     *
     * The character used as the decimal point in numeric and monetary
     * values (e.g., `.` for `1,234.56` or `,` for `1.234,56`).
     */
    #[SettingField(controlType: ControlType::Text, label: 'Decimal Separator', validation: ['nullable', 'string', 'max:1'], sortOrder: 4, group: 'Currency & Numbers')]
    public string $decimal_separator = '.';

    /**
     * Thousands grouping separator character.
     *
     * The character used to separate thousands groups in numeric and
     * monetary values (e.g., `,` for `1,234.56` or `.` for `1.234,56`).
     */
    #[SettingField(controlType: ControlType::Text, label: 'Thousands Separator', validation: ['nullable', 'string', 'max:1'], sortOrder: 5, group: 'Currency & Numbers')]
    public string $thousands_separator = ',';

    // ──────────────────────────────────────────────────────────────
    //  Pagination & Uploads
    // ──────────────────────────────────────────────────────────────

    /**
     * Default pagination page size.
     *
     * The number of items displayed per page in list views, tables,
     * and paginated API responses when no explicit page size is
     * requested. Must be between 5 and 100.
     */
    #[SettingGroup(label: 'Pagination & Uploads', description: 'Default page sizes and file upload limits.', icon: 'list', sortOrder: 4)]
    #[SettingField(controlType: ControlType::Number, label: 'Items Per Page', validation: ['nullable', 'integer', 'min:5', 'max:100'], sortOrder: 1, group: 'Pagination & Uploads', min: 5, max: 100)]
    public int $pagination_per_page = 15;

    /**
     * Maximum file upload size in megabytes.
     *
     * The upper limit for file uploads across the application.
     * Individual upload endpoints may enforce stricter limits.
     * Must be between 1 and 100 MB.
     */
    #[SettingField(controlType: ControlType::Number, label: 'Max Upload Size (MB)', validation: ['nullable', 'integer', 'min:1', 'max:100'], sortOrder: 2, group: 'Pagination & Uploads', min: 1, max: 100)]
    public int $max_upload_size_mb = 10;

    // ──────────────────────────────────────────────────────────────
    //  Maintenance
    // ──────────────────────────────────────────────────────────────

    /**
     * Maintenance mode toggle.
     *
     * When enabled, the application displays the maintenance message
     * to all non-admin visitors and restricts access to core functionality.
     * Admin users retain full access during maintenance.
     */
    #[SettingGroup(label: 'Maintenance', description: 'Maintenance mode and visitor messaging.', icon: 'wrench', sortOrder: 5)]
    #[SettingField(controlType: ControlType::Toggle, label: 'Maintenance Mode', validation: ['nullable', 'boolean'], sortOrder: 1, group: 'Maintenance')]
    public bool $maintenance_mode = false;

    /**
     * Maintenance mode message.
     *
     * The message displayed to visitors when maintenance mode is active.
     * Supports plain text up to 500 characters. When empty, a default
     * maintenance message is shown.
     */
    #[SettingField(controlType: ControlType::Text, label: 'Maintenance Message', validation: ['nullable', 'string', 'max:500'], sortOrder: 2, group: 'Maintenance')]
    public string $maintenance_message = '';

    /**
     * Get the Spatie Settings group identifier.
     *
     * This value is used as the database group prefix for all general
     * setting properties (e.g., `general.app_name`, `general.timezone`).
     *
     * @return string The settings group key.
     */
    public static function group(): string
    {
        return 'general';
    }
}
