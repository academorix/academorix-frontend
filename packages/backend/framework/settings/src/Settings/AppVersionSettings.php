<?php

declare(strict_types=1);

/**
 * AppVersionSettings — Application Version & Update Management.
 *
 * Defines the canonical schema for app version settings within the
 * Unified Settings System. These settings control version metadata,
 * update URLs per platform, and flags indicating whether updates are
 * available or mandatory.
 *
 * Properties are organized into logical groups:
 *
 * - **Version Info** — Current version, minimum version, release notes URL.
 * - **Update URLs** — Per-platform update download URLs.
 * - **Platform Flags** — Per-platform update availability and mandatory flag.
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

/**
 * App Version Settings.
 *
 * System-scoped, publicly accessible settings for app version management.
 * Consumed by all client platforms to determine if an update is available.
 */
#[AsSetting(group: 'app_version', label: 'App Version', description: 'Application version and update management.', icon: 'package', scope: 'system', public: true, sortOrder: 6)]
class AppVersionSettings extends Settings
{
    // ── Version Info ─────────────────────────────────────────────

    #[SettingGroup(label: 'Version Info', description: 'Current and minimum supported version.', icon: 'tag', sortOrder: 1)]
    #[SettingField(controlType: ControlType::Text, label: 'Current Version', validation: ['nullable', 'string', 'max:20'], sortOrder: 1, group: 'Version Info')]
    public string $current_version = '1.0.0';

    #[SettingField(controlType: ControlType::Text, label: 'Minimum Supported Version', validation: ['nullable', 'string', 'max:20'], sortOrder: 2, group: 'Version Info')]
    public string $min_version = '1.0.0';

    #[SettingField(controlType: ControlType::Url, label: 'Release Notes URL', validation: ['nullable', 'string', 'url', 'max:500'], sortOrder: 3, group: 'Version Info')]
    public string $release_notes_url = '';

    // ── Update URLs ──────────────────────────────────────────────

    #[SettingGroup(label: 'Update URLs', description: 'Per-platform update download URLs.', icon: 'download', sortOrder: 2)]
    #[SettingField(controlType: ControlType::Url, label: 'Web Update URL', validation: ['nullable', 'string', 'url', 'max:500'], sortOrder: 1, group: 'Update URLs')]
    public string $web_update_url = '';

    #[SettingField(controlType: ControlType::Url, label: 'Desktop Update URL', validation: ['nullable', 'string', 'url', 'max:500'], sortOrder: 2, group: 'Update URLs')]
    public string $desktop_update_url = '';

    #[SettingField(controlType: ControlType::Url, label: 'Mobile Update URL', validation: ['nullable', 'string', 'url', 'max:500'], sortOrder: 3, group: 'Update URLs')]
    public string $mobile_update_url = '';

    // ── Platform Flags ───────────────────────────────────────────

    #[SettingGroup(label: 'Platform Flags', description: 'Per-platform update availability and mandatory flag.', icon: 'flag', sortOrder: 3)]
    #[SettingField(controlType: ControlType::Toggle, label: 'Web Update Available', sortOrder: 1, group: 'Platform Flags')]
    public bool $web_update_available = false;

    #[SettingField(controlType: ControlType::Toggle, label: 'Desktop Update Available', sortOrder: 2, group: 'Platform Flags')]
    public bool $desktop_update_available = false;

    #[SettingField(controlType: ControlType::Toggle, label: 'Mobile Update Available', sortOrder: 3, group: 'Platform Flags')]
    public bool $mobile_update_available = false;

    /** Whether the update is mandatory — blocks usage until updated. */
    #[SettingField(controlType: ControlType::Toggle, label: 'Mandatory Update', sortOrder: 4, group: 'Platform Flags')]
    public bool $mandatory = false;

    public static function group(): string
    {
        return 'app_version';
    }
}
