<?php

/**
 * @file src/Settings/PasswordSettings.php
 *
 * @description
 * Password-policy floor. Ported from the `MIN_LENGTH_FLOOR`
 * constant + the `PASSWORD_MIN_LENGTH` env read in the old
 * `Academorix\User\Support\PasswordPolicy::rules()`. The policy
 * lifted the effective floor to `max(env, 12)`, so any operator
 * misconfiguring the env below 12 was silently ignored. Moved
 * here so the value is visible in the admin UI and audited on
 * change, but the max(env, 12) safety wrapper stays in the
 * PasswordPolicy caller.
 *
 * ## Group key
 *
 * `auth_password` — stored under
 * `scope_values.namespace='settings'`.
 *
 * ## Scope
 *
 * `System` — a single platform-wide policy.
 */

declare(strict_types=1);

namespace Academorix\Authorization\Settings;

use Academorix\Settings\Attributes\AsSetting;
use Academorix\Settings\Attributes\SettingField;
use Academorix\Settings\Enums\ControlType;
use Academorix\Settings\Enums\SettingScope;

/**
 * Password strength policy.
 */
#[AsSetting(
    group: 'auth_password',
    label: 'Password policy',
    description: 'Password minimum length and complexity policy for both admin and end-user populations.',
    icon: 'key',
    permission: 'settings.auth.read',
    scope: SettingScope::System,
    sortOrder: 230,
)]
final class PasswordSettings
{
    /**
     * Absolute floor for the minimum password length.
     *
     * ## Safety note
     *
     * The `PasswordPolicy::rules()` helper enforces a hard floor
     * of 12 characters — an operator setting this to anything
     * lower is clamped up to 12 at the call site. The knob is
     * still exposed so the value is auditable; the clamp is
     * intentional.
     */
    #[SettingField(
        controlType: ControlType::Number,
        label: 'Minimum password length',
        description: 'Minimum password length. The password-policy helper enforces a hard floor of 12 characters — values below 12 are ignored.',
        validation: ['integer', 'min:12', 'max:256'],
        min: 12,
        max: 256,
        step: 1,
        sortOrder: 10,
    )]
    public int $min_length = 12;
}
