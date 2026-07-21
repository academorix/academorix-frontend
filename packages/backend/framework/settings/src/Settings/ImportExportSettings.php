<?php

declare(strict_types=1);

/**
 * ImportExportSettings — Data Import & Export Configuration.
 *
 * Defines the canonical schema for import/export settings within the
 * Unified Settings System. Controls batch processing sizes, timeouts,
 * default formats, and column mapping behavior.
 *
 * @category Settings
 *
 * @since    1.0.0
 */

namespace Stackra\Settings\Settings;

use Spatie\LaravelSettings\Settings;
use Stackra\Settings\Attributes\AsSetting;
use Stackra\Settings\Attributes\SettingField;
use Stackra\Settings\Attributes\SettingGroup;
use Stackra\Settings\Enums\ControlType;
use Stackra\Settings\Enums\ImportFormat;

/**
 * Import/Export Settings.
 *
 * Tenant-scoped settings for data import and export operations. Each
 * tenant can configure their own batch sizes, timeouts, and format
 * preferences.
 */
#[AsSetting(group: 'import_export', label: 'Import / Export', description: 'Data import and export configuration.', icon: 'arrow-left-right', scope: 'tenant', sortOrder: 13)]
class ImportExportSettings extends Settings
{
    // ── Import ───────────────────────────────────────────────────

    #[SettingGroup(label: 'Import', description: 'Import batch processing and validation.', icon: 'upload', sortOrder: 1)]
    #[SettingField(controlType: ControlType::Number, label: 'Import Batch Size', validation: ['nullable', 'integer', 'min:10', 'max:10000'], sortOrder: 1, group: 'Import', min: 10, max: 10000)]
    public int $import_batch_size = 500;

    #[SettingField(controlType: ControlType::Number, label: 'Import Timeout (seconds)', validation: ['nullable', 'integer', 'min:30', 'max:7200'], sortOrder: 2, group: 'Import', min: 30, max: 7200)]
    public int $import_timeout_seconds = 600;

    #[SettingField(controlType: ControlType::Number, label: 'Max Import Rows', validation: ['nullable', 'integer', 'min:100', 'max:1000000'], sortOrder: 3, group: 'Import', min: 100, max: 1000000)]
    public int $max_import_rows = 100000;

    #[SettingField(controlType: ControlType::Toggle, label: 'Validate Before Import', sortOrder: 4, group: 'Import')]
    public bool $validate_before_import = true;

    #[SettingField(controlType: ControlType::Toggle, label: 'Skip Duplicates', sortOrder: 5, group: 'Import')]
    public bool $skip_duplicates = true;

    // ── Export ───────────────────────────────────────────────────

    #[SettingGroup(label: 'Export', description: 'Export format and processing settings.', icon: 'download', sortOrder: 2)]
    #[SettingField(controlType: ControlType::Select, label: 'Default Format', validation: ['nullable', 'string', 'in:csv,xlsx,json'], sortOrder: 1, group: 'Export', options: ImportFormat::class)]
    public string $default_format = 'xlsx';

    #[SettingField(controlType: ControlType::Number, label: 'Export Batch Size', validation: ['nullable', 'integer', 'min:10', 'max:10000'], sortOrder: 2, group: 'Export', min: 10, max: 10000)]
    public int $export_batch_size = 1000;

    #[SettingField(controlType: ControlType::Number, label: 'Export Timeout (seconds)', validation: ['nullable', 'integer', 'min:30', 'max:7200'], sortOrder: 3, group: 'Export', min: 30, max: 7200)]
    public int $export_timeout_seconds = 600;

    // ── Column Mapping ───────────────────────────────────────────

    #[SettingGroup(label: 'Column Mapping', description: 'Column mapping and header detection.', icon: 'columns', sortOrder: 3)]
    #[SettingField(controlType: ControlType::Toggle, label: 'Auto-Detect Headers', sortOrder: 1, group: 'Column Mapping')]
    public bool $auto_detect_headers = true;

    #[SettingField(controlType: ControlType::Toggle, label: 'Save Column Mappings', sortOrder: 2, group: 'Column Mapping')]
    public bool $save_column_mappings = true;

    #[SettingField(controlType: ControlType::Number, label: 'Max Saved Mappings', validation: ['nullable', 'integer', 'min:1', 'max:50'], sortOrder: 3, group: 'Column Mapping', min: 1, max: 50)]
    public int $max_saved_mappings = 10;

    public static function group(): string
    {
        return 'import_export';
    }
}
