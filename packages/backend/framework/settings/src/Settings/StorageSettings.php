<?php

declare(strict_types=1);

/**
 * StorageSettings — File Storage & CDN Configuration.
 *
 * Defines the canonical schema for storage settings within the Unified
 * Settings System. Controls default disk selection, upload limits,
 * allowed file types, and CDN configuration.
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
use Stackra\Settings\Enums\CloudDisk;
use Stackra\Settings\Enums\ControlType;
use Stackra\Settings\Enums\StorageDisk;

/**
 * Storage Settings.
 *
 * System-scoped settings for file storage infrastructure. Shared across
 * all tenants since storage backends are typically centralized.
 */
#[AsSetting(group: 'storage', label: 'Storage', description: 'File storage and CDN configuration.', icon: 'hard-drive', scope: 'system', sortOrder: 7)]
class StorageSettings extends Settings
{
    // ── Disk Configuration ───────────────────────────────────────

    #[SettingGroup(label: 'Disk Configuration', description: 'Default and cloud storage disk selection.', icon: 'database', sortOrder: 1)]
    #[SettingField(controlType: ControlType::Select, label: 'Default Disk', validation: ['nullable', 'string', 'in:local,public,s3'], sortOrder: 1, group: 'Disk Configuration', options: StorageDisk::class)]
    public string $default_disk = 'public';

    #[SettingField(controlType: ControlType::Select, label: 'Cloud Disk', validation: ['nullable', 'string', 'in:s3,gcs,azure'], sortOrder: 2, group: 'Disk Configuration', options: CloudDisk::class)]
    public string $cloud_disk = 's3';

    // ── Upload Limits ────────────────────────────────────────────

    #[SettingGroup(label: 'Upload Limits', description: 'File size limits and allowed MIME types.', icon: 'upload', sortOrder: 2)]
    #[SettingField(controlType: ControlType::Number, label: 'Max Upload Size (MB)', validation: ['nullable', 'integer', 'min:1', 'max:500'], sortOrder: 1, group: 'Upload Limits', min: 1, max: 500)]
    public int $max_upload_size_mb = 10;

    #[SettingField(controlType: ControlType::Text, label: 'Allowed Image Types', validation: ['nullable', 'string', 'max:200'], sortOrder: 2, group: 'Upload Limits')]
    public string $allowed_image_types = 'jpg,jpeg,png,gif,svg,webp';

    #[SettingField(controlType: ControlType::Text, label: 'Allowed Document Types', validation: ['nullable', 'string', 'max:200'], sortOrder: 3, group: 'Upload Limits')]
    public string $allowed_document_types = 'pdf,doc,docx,xls,xlsx,csv,txt';

    #[SettingField(controlType: ControlType::Text, label: 'Allowed Video Types', validation: ['nullable', 'string', 'max:200'], sortOrder: 4, group: 'Upload Limits')]
    public string $allowed_video_types = 'mp4,mov,avi,webm';

    /** Maximum image width/height in pixels. */
    #[SettingField(controlType: ControlType::Number, label: 'Max Image Dimensions (px)', validation: ['nullable', 'integer', 'min:100', 'max:10000'], sortOrder: 5, group: 'Upload Limits', min: 100, max: 10000)]
    public int $max_image_dimensions = 4096;

    // ── CDN ──────────────────────────────────────────────────────

    #[SettingGroup(label: 'CDN', description: 'Content delivery network configuration.', icon: 'globe', sortOrder: 3)]
    #[SettingField(controlType: ControlType::Toggle, label: 'CDN Enabled', sortOrder: 1, group: 'CDN')]
    public bool $cdn_enabled = false;

    #[SettingField(controlType: ControlType::Url, label: 'CDN URL', validation: ['nullable', 'string', 'url', 'max:500'], sortOrder: 2, group: 'CDN')]
    public string $cdn_url = '';

    #[SettingField(controlType: ControlType::Text, label: 'CDN Path Prefix', validation: ['nullable', 'string', 'max:100'], sortOrder: 3, group: 'CDN')]
    public string $cdn_path_prefix = '';

    public static function group(): string
    {
        return 'storage';
    }
}
