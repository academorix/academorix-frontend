<?php

/**
 * @file src/Settings/DiagnosticsSettings.php
 *
 * @description
 * Cross-cutting diagnostics + developer-tool exposure knobs.
 * Ported from `foundation.scramble.expose_in_production` in the
 * old codebase. The single-purpose group leaves room for future
 * dev-tool toggles (debug bar, query log, telemetry export
 * modes) to accumulate here rather than sprinkle across every
 * module.
 *
 * ## Group key
 *
 * `diagnostics` — stored under
 * `scope_values.namespace='settings'` with keys
 * `diagnostics.scramble_expose_in_production`.
 *
 * ## Scope
 *
 * `System` — dev tools are a platform-wide operator decision.
 */

declare(strict_types=1);

namespace Stackra\Foundation\Settings;

use Stackra\Settings\Attributes\AsSetting;
use Stackra\Settings\Attributes\SettingField;
use Stackra\Settings\Enums\ControlType;
use Stackra\Settings\Enums\SettingScope;

/**
 * Diagnostics + developer-tool exposure toggles.
 */
#[AsSetting(
    group: 'diagnostics',
    label: 'Diagnostics',
    description: 'Developer-tool exposure toggles (API docs, debug surfaces).',
    icon: 'wrench',
    permission: 'settings.diagnostics.read',
    scope: SettingScope::System,
    sortOrder: 850,
)]
final class DiagnosticsSettings
{
    /**
     * Whether the Scramble-generated OpenAPI/Swagger UI is
     * exposed when `APP_ENV === 'production'`. Off by default —
     * a production API surface should not advertise its own
     * schema to unauthenticated visitors. Flip on for a public
     * developer portal.
     */
    #[SettingField(
        controlType: ControlType::Toggle,
        label: 'Expose Scramble API docs in production',
        description: 'When enabled, the auto-generated OpenAPI documentation is served on production hosts. Off by default — flip only when the platform hosts a public developer portal.',
        sortOrder: 10,
    )]
    public bool $scramble_expose_in_production = false;
}
