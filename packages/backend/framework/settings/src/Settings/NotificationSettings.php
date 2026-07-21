<?php

declare(strict_types=1);

/**
 * NotificationSettings — Notification Channel & Delivery Preferences.
 *
 * Defines the canonical schema for notification settings within the
 * Unified Settings System. These settings control which notification
 * channels are active, digest aggregation behavior, quiet-hours
 * scheduling, and delivery retry/batching parameters.
 *
 * Properties are organized into logical groups:
 *
 * - **Channels** — Toggle individual notification channels (email, SMS, push, in-app).
 * - **Digest** — Enable digest mode and configure frequency and delivery time.
 * - **Quiet Hours** — Define a nightly window during which notifications are held.
 * - **Delivery** — Retry limits, delay intervals, and batch sizing for the dispatcher.
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
use Stackra\Settings\Enums\DigestFrequency;

/**
 * Notification Settings.
 *
 * Stores notification channel and delivery configuration values scoped
 * to the tenant level, allowing each tenant to customize their own
 * notification behavior independently.
 *
 * **Channels:**
 * - `email_enabled`: Whether email notifications are active.
 * - `sms_enabled`: Whether SMS notifications are active.
 * - `push_enabled`: Whether push notifications are active.
 * - `in_app_enabled`: Whether in-app notifications are active.
 *
 * **Digest:**
 * - `digest_enabled`: Whether notification digests are active.
 * - `digest_frequency`: How often digests are sent (hourly, daily, weekly).
 * - `digest_time`: Time of day digests are dispatched (HH:MM format).
 *
 * **Quiet Hours:**
 * - `quiet_hours_enabled`: Whether quiet hours are enforced.
 * - `quiet_hours_start`: Start time for the quiet window (HH:MM format).
 * - `quiet_hours_end`: End time for the quiet window (HH:MM format).
 *
 * **Delivery:**
 * - `max_retries`: Maximum number of delivery retry attempts.
 * - `retry_delay_seconds`: Delay in seconds between retry attempts.
 * - `batch_size`: Number of notifications processed per dispatch batch.
 */
#[AsSetting(group: 'notification', label: 'Notifications', description: 'Notification channel and delivery preferences.', icon: 'bell', scope: 'tenant', sortOrder: 3)]
class NotificationSettings extends Settings
{
    // ──────────────────────────────────────────────────────────────
    //  Channels
    // ──────────────────────────────────────────────────────────────

    /**
     * Email channel toggle.
     *
     * When enabled, the notification dispatcher will route eligible
     * notifications to the email channel. Requires a valid mail
     * driver configuration.
     */
    #[SettingGroup(label: 'Channels', description: 'Toggle individual notification channels.', icon: 'radio', sortOrder: 1)]
    #[SettingField(controlType: ControlType::Toggle, label: 'Email Enabled', sortOrder: 1, group: 'Channels')]
    public bool $email_enabled = true;

    /**
     * SMS channel toggle.
     *
     * When enabled, the notification dispatcher will route eligible
     * notifications to the SMS channel. Requires a configured SMS
     * provider (e.g., Twilio, Vonage).
     */
    #[SettingField(controlType: ControlType::Toggle, label: 'SMS Enabled', sortOrder: 2, group: 'Channels')]
    public bool $sms_enabled = false;

    /**
     * Push notification channel toggle.
     *
     * When enabled, the notification dispatcher will route eligible
     * notifications to the push channel via Firebase Cloud Messaging
     * or a compatible push provider.
     */
    #[SettingField(controlType: ControlType::Toggle, label: 'Push Enabled', sortOrder: 3, group: 'Channels')]
    public bool $push_enabled = true;

    /**
     * In-app notification channel toggle.
     *
     * When enabled, notifications are stored in the database and
     * displayed within the application's notification center UI.
     */
    #[SettingField(controlType: ControlType::Toggle, label: 'In-App Enabled', sortOrder: 4, group: 'Channels')]
    public bool $in_app_enabled = true;

    // ──────────────────────────────────────────────────────────────
    //  Digest
    // ──────────────────────────────────────────────────────────────

    /**
     * Digest mode toggle.
     *
     * When enabled, individual notifications are aggregated into a
     * single digest message delivered at the configured frequency
     * and time instead of being sent immediately.
     */
    #[SettingGroup(label: 'Digest', description: 'Notification digest aggregation settings.', icon: 'layers', sortOrder: 2)]
    #[SettingField(controlType: ControlType::Toggle, label: 'Digest Enabled', sortOrder: 1, group: 'Digest')]
    public bool $digest_enabled = false;

    /**
     * Digest delivery frequency.
     *
     * Determines how often digest messages are compiled and sent.
     * Accepted values: `hourly`, `daily`, `weekly`.
     */
    #[SettingField(controlType: ControlType::Select, label: 'Digest Frequency', validation: ['nullable', 'string', 'in:hourly,daily,weekly'], sortOrder: 2, group: 'Digest', options: DigestFrequency::class)]
    public string $digest_frequency = 'daily';

    /**
     * Digest delivery time.
     *
     * The time of day (in HH:MM format, 24-hour clock) at which the
     * digest is compiled and dispatched. Only applicable when digest
     * frequency is `daily` or `weekly`.
     */
    #[SettingField(controlType: ControlType::Time, label: 'Digest Time', validation: ['nullable', 'string', 'max:5'], sortOrder: 3, group: 'Digest')]
    public string $digest_time = '09:00';

    // ──────────────────────────────────────────────────────────────
    //  Quiet Hours
    // ──────────────────────────────────────────────────────────────

    /**
     * Quiet hours toggle.
     *
     * When enabled, notifications are held in a queue during the
     * defined quiet window and delivered once the window ends.
     * Prevents notifications from disturbing users during off-hours.
     */
    #[SettingGroup(label: 'Quiet Hours', description: 'Define a window during which notifications are held.', icon: 'moon', sortOrder: 3)]
    #[SettingField(controlType: ControlType::Toggle, label: 'Quiet Hours Enabled', sortOrder: 1, group: 'Quiet Hours')]
    public bool $quiet_hours_enabled = false;

    /**
     * Quiet hours start time.
     *
     * The time (in HH:MM format, 24-hour clock) at which the quiet
     * window begins. Notifications arriving after this time are queued
     * until the quiet window ends.
     */
    #[SettingField(controlType: ControlType::Time, label: 'Quiet Hours Start', validation: ['nullable', 'string', 'max:5'], sortOrder: 2, group: 'Quiet Hours')]
    public string $quiet_hours_start = '22:00';

    /**
     * Quiet hours end time.
     *
     * The time (in HH:MM format, 24-hour clock) at which the quiet
     * window ends. Queued notifications are released for delivery
     * at this time.
     */
    #[SettingField(controlType: ControlType::Time, label: 'Quiet Hours End', validation: ['nullable', 'string', 'max:5'], sortOrder: 3, group: 'Quiet Hours')]
    public string $quiet_hours_end = '07:00';

    // ──────────────────────────────────────────────────────────────
    //  Delivery
    // ──────────────────────────────────────────────────────────────

    /**
     * Maximum delivery retry attempts.
     *
     * The number of times the dispatcher will retry a failed
     * notification delivery before marking it as permanently failed.
     * Must be between 0 (no retries) and 10.
     */
    #[SettingGroup(label: 'Delivery', description: 'Retry limits, delay intervals, and batch sizing.', icon: 'send', sortOrder: 4)]
    #[SettingField(controlType: ControlType::Number, label: 'Max Retries', validation: ['nullable', 'integer', 'min:0', 'max:10'], sortOrder: 1, group: 'Delivery', min: 0, max: 10)]
    public int $max_retries = 3;

    /**
     * Retry delay in seconds.
     *
     * The number of seconds to wait between consecutive retry
     * attempts for a failed notification. Must be between 10
     * and 3600 seconds (1 hour).
     */
    #[SettingField(controlType: ControlType::Number, label: 'Retry Delay (seconds)', validation: ['nullable', 'integer', 'min:10', 'max:3600'], sortOrder: 2, group: 'Delivery', min: 10, max: 3600)]
    public int $retry_delay_seconds = 60;

    /**
     * Dispatch batch size.
     *
     * The number of notifications processed in a single dispatch
     * cycle. Larger batches improve throughput but increase memory
     * usage. Must be between 1 and 1000.
     */
    #[SettingField(controlType: ControlType::Number, label: 'Batch Size', validation: ['nullable', 'integer', 'min:1', 'max:1000'], sortOrder: 3, group: 'Delivery', min: 1, max: 1000)]
    public int $batch_size = 100;

    /**
     * Get the Spatie Settings group identifier.
     *
     * This value is used as the database group prefix for all notification
     * setting properties (e.g., `notification.email_enabled`, `notification.digest_frequency`).
     *
     * @return string The settings group key.
     */
    public static function group(): string
    {
        return 'notification';
    }
}
