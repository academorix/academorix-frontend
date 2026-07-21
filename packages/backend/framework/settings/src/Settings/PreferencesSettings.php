<?php

declare(strict_types=1);

/**
 * PreferencesSettings — User-Level Preferences.
 *
 * Defines the canonical schema for user preferences within the Unified
 * Settings System. These are per-user settings that override tenant and
 * system defaults for the individual user's session.
 *
 * Stored under `user_{userId}.preferences` in the Spatie settings table.
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
use Stackra\Settings\Enums\ColorMode;
use Stackra\Settings\Enums\ControlType;
use Stackra\Settings\Enums\FontSize;
use Stackra\Settings\Enums\UiDensity;

/**
 * User Preferences Settings.
 *
 * User-scoped settings that allow each user to personalize their
 * experience. These override tenant-level and system-level defaults
 * in the hierarchy resolution chain.
 */
#[AsSetting(group: 'preferences', label: 'Preferences', description: 'User-level display and interaction preferences.', icon: 'user-cog', scope: 'user', sortOrder: 10)]
class PreferencesSettings extends Settings
{
    // ── Appearance ───────────────────────────────────────────────

    /** Color mode: 'light', 'dark', or 'system' (follow OS preference). */
    #[SettingGroup(label: 'Appearance', description: 'Visual display preferences.', icon: 'palette', sortOrder: 1)]
    #[SettingField(controlType: ControlType::Select, label: 'Color Mode', validation: ['nullable', 'string', 'in:light,dark,system'], sortOrder: 1, group: 'Appearance', options: ColorMode::class)]
    public string $color_mode = 'system';

    /** UI density: 'comfortable', 'compact', or 'spacious'. */
    #[SettingField(controlType: ControlType::Select, label: 'UI Density', validation: ['nullable', 'string', 'in:comfortable,compact,spacious'], sortOrder: 2, group: 'Appearance', options: UiDensity::class)]
    public string $density = 'comfortable';

    #[SettingField(controlType: ControlType::Toggle, label: 'Sidebar Collapsed', sortOrder: 3, group: 'Appearance')]
    public bool $sidebar_collapsed = false;

    #[SettingField(controlType: ControlType::Toggle, label: 'Animations Enabled', sortOrder: 4, group: 'Appearance')]
    public bool $animations_enabled = true;

    // ── Regional ─────────────────────────────────────────────────

    /** Overrides the tenant default locale for this user. */
    #[SettingGroup(label: 'Regional', description: 'Language and timezone overrides.', icon: 'globe', sortOrder: 2)]
    #[SettingField(controlType: ControlType::Text, label: 'Language', validation: ['nullable', 'string', 'max:10'], sortOrder: 1, group: 'Regional')]
    public string $language = '';

    /** Overrides the tenant default timezone for this user. */
    #[SettingField(controlType: ControlType::Timezone, label: 'Timezone', validation: ['nullable', 'string', 'max:50'], sortOrder: 2, group: 'Regional')]
    public string $timezone = '';

    // ── Notifications ────────────────────────────────────────────

    #[SettingGroup(label: 'Notifications', description: 'Personal notification preferences.', icon: 'bell', sortOrder: 3)]
    #[SettingField(controlType: ControlType::Toggle, label: 'Email Notifications', sortOrder: 1, group: 'Notifications')]
    public bool $email_notifications = true;

    #[SettingField(controlType: ControlType::Toggle, label: 'Push Notifications', sortOrder: 2, group: 'Notifications')]
    public bool $push_notifications = true;

    #[SettingField(controlType: ControlType::Toggle, label: 'In-App Sound', sortOrder: 3, group: 'Notifications')]
    public bool $notification_sound = true;

    // ── Accessibility ────────────────────────────────────────────

    #[SettingGroup(label: 'Accessibility', description: 'Accessibility and assistive preferences.', icon: 'accessibility', sortOrder: 4)]
    #[SettingField(controlType: ControlType::Toggle, label: 'High Contrast Mode', sortOrder: 1, group: 'Accessibility')]
    public bool $high_contrast = false;

    #[SettingField(controlType: ControlType::Toggle, label: 'Reduce Motion', sortOrder: 2, group: 'Accessibility')]
    public bool $reduce_motion = false;

    #[SettingField(controlType: ControlType::Select, label: 'Font Size', validation: ['nullable', 'string', 'in:small,medium,large,xlarge'], sortOrder: 3, group: 'Accessibility', options: FontSize::class)]
    public string $font_size = 'medium';

    public static function group(): string
    {
        return 'preferences';
    }
}
