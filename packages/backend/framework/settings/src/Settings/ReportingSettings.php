<?php

declare(strict_types=1);

/**
 * ReportingSettings — Reporting & Export Configuration.
 *
 * Defines the canonical schema for reporting settings within the Unified
 * Settings System. Controls default export formats, scheduled report
 * retention, chart rendering defaults, and data limits.
 *
 * @category Settings
 *
 * @since    1.0.0
 */

namespace Academorix\Settings\Settings;

use Spatie\LaravelSettings\Settings;
use Academorix\Settings\Attributes\AsSetting;
use Academorix\Settings\Attributes\SettingField;
use Academorix\Settings\Attributes\SettingGroup;
use Academorix\Settings\Enums\ChartType;
use Academorix\Settings\Enums\ControlType;
use Academorix\Settings\Enums\ExportFormat;

/**
 * Reporting Settings.
 *
 * Tenant-scoped settings for reporting behavior. Each tenant can
 * configure their own export preferences, retention policies, and
 * chart rendering defaults.
 */
#[AsSetting(group: 'reporting', label: 'Reporting', description: 'Reporting, export, and chart configuration.', icon: 'bar-chart-2', scope: 'tenant', sortOrder: 12)]
class ReportingSettings extends Settings
{
    // ── Export ───────────────────────────────────────────────────

    #[SettingGroup(label: 'Export', description: 'Default export format and limits.', icon: 'download', sortOrder: 1)]
    #[SettingField(controlType: ControlType::Select, label: 'Default Export Format', validation: ['nullable', 'string', 'in:csv,xlsx,pdf,json'], sortOrder: 1, group: 'Export', options: ExportFormat::class)]
    public string $default_export_format = 'xlsx';

    #[SettingField(controlType: ControlType::Number, label: 'Max Export Rows', validation: ['nullable', 'integer', 'min:100', 'max:1000000'], sortOrder: 2, group: 'Export', min: 100, max: 1000000)]
    public int $max_export_rows = 50000;

    #[SettingField(controlType: ControlType::Number, label: 'Export Timeout (seconds)', validation: ['nullable', 'integer', 'min:30', 'max:3600'], sortOrder: 3, group: 'Export', min: 30, max: 3600)]
    public int $export_timeout_seconds = 300;

    // ── Scheduled Reports ────────────────────────────────────────

    #[SettingGroup(label: 'Scheduled Reports', description: 'Retention and delivery settings for scheduled reports.', icon: 'clock', sortOrder: 2)]
    #[SettingField(controlType: ControlType::Number, label: 'Retention (days)', validation: ['nullable', 'integer', 'min:1', 'max:365'], sortOrder: 1, group: 'Scheduled Reports', min: 1, max: 365)]
    public int $retention_days = 90;

    #[SettingField(controlType: ControlType::Number, label: 'Max Scheduled Reports', validation: ['nullable', 'integer', 'min:1', 'max:100'], sortOrder: 2, group: 'Scheduled Reports', min: 1, max: 100)]
    public int $max_scheduled_reports = 20;

    #[SettingField(controlType: ControlType::Toggle, label: 'Email Delivery Enabled', sortOrder: 3, group: 'Scheduled Reports')]
    public bool $email_delivery_enabled = true;

    // ── Charts ───────────────────────────────────────────────────

    #[SettingGroup(label: 'Charts', description: 'Chart rendering defaults.', icon: 'pie-chart', sortOrder: 3)]
    #[SettingField(controlType: ControlType::Select, label: 'Default Chart Type', validation: ['nullable', 'string', 'in:bar,line,pie,doughnut,area'], sortOrder: 1, group: 'Charts', options: ChartType::class)]
    public string $default_chart_type = 'bar';

    #[SettingField(controlType: ControlType::Toggle, label: 'Show Data Labels', sortOrder: 2, group: 'Charts')]
    public bool $show_data_labels = false;

    #[SettingField(controlType: ControlType::Toggle, label: 'Show Legend', sortOrder: 3, group: 'Charts')]
    public bool $show_legend = true;

    public static function group(): string
    {
        return 'reporting';
    }
}
