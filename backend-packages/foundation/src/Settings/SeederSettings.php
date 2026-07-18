<?php

/**
 * @file src/Settings/SeederSettings.php
 *
 * @description
 * Seeder-behaviour knobs. Ported from
 * `academorix.seeder.default_row_count` used by 15+ demo seeders
 * in the old codebase — a single knob that lets a demo tenant
 * boot with a small dataset on a laptop and a large one on a
 * staging VM without hand-editing every seeder file.
 *
 * ## Group key
 *
 * `seeder` — stored under `scope_values.namespace='settings'`
 * with key `seeder.default_row_count`.
 *
 * ## Scope
 *
 * `System` — seeders run before any tenant context exists, so a
 * tenant-tier setting would be unreachable at seeder time.
 */

declare(strict_types=1);

namespace Academorix\Foundation\Settings;

use Academorix\Settings\Attributes\AsSetting;
use Academorix\Settings\Attributes\SettingField;
use Academorix\Settings\Enums\ControlType;
use Academorix\Settings\Enums\SettingScope;

/**
 * Seeder defaults.
 *
 * ## Usage
 *
 * ```php
 * // Inside a demo seeder:
 * $rows = (int) $settings->get('seeder.default_row_count');
 * MyModel::factory()->count($rows)->create();
 * ```
 */
#[AsSetting(
    group: 'seeder',
    label: 'Seeders',
    description: 'Demo-seed dataset sizing.',
    icon: 'database',
    scope: SettingScope::System,
    sortOrder: 900,
)]
final class SeederSettings
{
    /**
     * How many rows every demo seeder generates when it doesn't
     * override the count explicitly. Default of 20 keeps a
     * laptop-hosted demo tenant snappy; staging environments
     * often bump this to 500+ to stress-test list views.
     */
    #[SettingField(
        controlType: ControlType::Number,
        label: 'Default demo row count',
        description: 'Number of rows every demo seeder generates when it does not override the count.',
        validation: ['integer', 'min:1', 'max:100000'],
        min: 1,
        max: 100000,
        step: 1,
        sortOrder: 10,
    )]
    public int $default_row_count = 20;
}
