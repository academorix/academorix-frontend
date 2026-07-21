<?php

declare(strict_types=1);

/**
 * SearchSettings — Search Engine Configuration.
 *
 * Defines the canonical schema for search settings within the Unified
 * Settings System. Controls search driver selection, result limits,
 * fuzzy matching, and indexing behavior.
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
use Stackra\Settings\Enums\SearchDriver;

/**
 * Search Settings.
 *
 * Tenant-scoped settings for search behavior. Each tenant can configure
 * their own search driver, result limits, and matching preferences.
 */
#[AsSetting(group: 'search', label: 'Search', description: 'Search engine and indexing configuration.', icon: 'search', scope: 'tenant', sortOrder: 11)]
class SearchSettings extends Settings
{
    // ── Engine ───────────────────────────────────────────────────

    #[SettingGroup(label: 'Engine', description: 'Search driver and connection settings.', icon: 'cpu', sortOrder: 1)]
    #[SettingField(controlType: ControlType::Select, label: 'Search Driver', validation: ['nullable', 'string', 'in:database,meilisearch,elasticsearch,algolia'], sortOrder: 1, group: 'Engine', options: SearchDriver::class)]
    public string $driver = 'database';

    #[SettingField(controlType: ControlType::Number, label: 'Default Result Limit', validation: ['nullable', 'integer', 'min:5', 'max:200'], sortOrder: 2, group: 'Engine', min: 5, max: 200)]
    public int $default_result_limit = 25;

    #[SettingField(controlType: ControlType::Number, label: 'Max Result Limit', validation: ['nullable', 'integer', 'min:10', 'max:1000'], sortOrder: 3, group: 'Engine', min: 10, max: 1000)]
    public int $max_result_limit = 100;

    // ── Matching ─────────────────────────────────────────────────

    #[SettingGroup(label: 'Matching', description: 'Fuzzy matching and relevance tuning.', icon: 'target', sortOrder: 2)]
    #[SettingField(controlType: ControlType::Toggle, label: 'Fuzzy Matching Enabled', sortOrder: 1, group: 'Matching')]
    public bool $fuzzy_enabled = true;

    /** Fuzzy matching threshold (0.0 = exact, 1.0 = very fuzzy). */
    #[SettingField(controlType: ControlType::Text, label: 'Fuzzy Threshold', validation: ['nullable', 'string', 'max:5'], sortOrder: 2, group: 'Matching')]
    public string $fuzzy_threshold = '0.3';

    #[SettingField(controlType: ControlType::Toggle, label: 'Highlight Results', sortOrder: 3, group: 'Matching')]
    public bool $highlight_enabled = true;

    // ── Indexing ─────────────────────────────────────────────────

    #[SettingGroup(label: 'Indexing', description: 'Index rebuild and sync settings.', icon: 'refresh-cw', sortOrder: 3)]
    #[SettingField(controlType: ControlType::Toggle, label: 'Auto-Index on Save', sortOrder: 1, group: 'Indexing')]
    public bool $auto_index = true;

    #[SettingField(controlType: ControlType::Number, label: 'Index Batch Size', validation: ['nullable', 'integer', 'min:10', 'max:5000'], sortOrder: 2, group: 'Indexing', min: 10, max: 5000)]
    public int $index_batch_size = 500;

    public static function group(): string
    {
        return 'search';
    }
}
