<?php

declare(strict_types=1);

/**
 * MailSettings — Email Delivery Configuration.
 *
 * Defines the canonical schema for mail settings within the Unified
 * Settings System. These settings control the email delivery driver,
 * sender identity, SMTP connection parameters, and provider-specific
 * credentials for Mailgun and Amazon SES.
 *
 * Properties are organized into logical groups:
 *
 * - **Sender** — Mail driver selection, from name/address, and reply-to address.
 * - **SMTP** — Host, port, encryption, and authentication for SMTP transport.
 * - **Mailgun** — Domain and API secret for the Mailgun driver.
 * - **Amazon SES** — Access key, secret, and region for the SES driver.
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
use Stackra\Settings\Enums\MailDriver;
use Stackra\Settings\Enums\SmtpEncryption;

/**
 * Mail Settings.
 *
 * Stores email delivery configuration values scoped to the system level.
 * System scope ensures a single global mail configuration shared across
 * all tenants, as mail infrastructure is typically centralized.
 *
 * **Sender:**
 * - `driver`: The mail transport driver (smtp, mailgun, ses, postmark, log).
 * - `from_name`: Display name used in the "From" header of outgoing emails.
 * - `from_address`: Email address used in the "From" header.
 * - `reply_to_address`: Email address used in the "Reply-To" header.
 *
 * **SMTP:**
 * - `smtp_host`: SMTP server hostname.
 * - `smtp_port`: SMTP server port number.
 * - `smtp_encryption`: Encryption protocol (tls, ssl, none).
 * - `smtp_username`: SMTP authentication username.
 * - `smtp_password`: SMTP authentication password.
 *
 * **Mailgun:**
 * - `mailgun_domain`: Mailgun sending domain.
 * - `mailgun_secret`: Mailgun API secret key.
 *
 * **Amazon SES:**
 * - `ses_key`: AWS access key ID for SES.
 * - `ses_secret`: AWS secret access key for SES.
 * - `ses_region`: AWS region for the SES endpoint.
 */
#[AsSetting(group: 'mail', label: 'Mail', description: 'Email delivery configuration.', icon: 'mail', scope: 'system', sortOrder: 5)]
class MailSettings extends Settings
{
    // ──────────────────────────────────────────────────────────────
    //  Sender
    // ──────────────────────────────────────────────────────────────

    /**
     * Mail transport driver.
     *
     * Determines which mail transport is used for sending emails.
     * Accepted values: `smtp`, `mailgun`, `ses`, `postmark`, `log`.
     * The `log` driver writes emails to the application log instead
     * of sending them, useful for local development.
     */
    #[SettingGroup(label: 'Sender', description: 'Mail driver selection and sender identity.', icon: 'user', sortOrder: 1)]
    #[SettingField(controlType: ControlType::Select, label: 'Driver', validation: ['nullable', 'string', 'in:smtp,mailgun,ses,postmark,log'], sortOrder: 1, group: 'Sender', options: MailDriver::class)]
    public string $driver = 'smtp';

    /**
     * Sender display name.
     *
     * The human-readable name that appears in the "From" header of
     * outgoing emails (e.g., "Stackra" or "Acme Support"). Recipients
     * see this name in their inbox alongside the from address.
     */
    #[SettingField(controlType: ControlType::Text, label: 'From Name', validation: ['nullable', 'string', 'max:100'], sortOrder: 2, group: 'Sender')]
    public string $from_name = 'Stackra';

    /**
     * Sender email address.
     *
     * The email address used in the "From" header of outgoing emails.
     * Must be a valid email address that the configured mail driver
     * is authorized to send from.
     */
    #[SettingField(controlType: ControlType::Email, label: 'From Address', validation: ['nullable', 'string', 'email', 'max:255'], sortOrder: 3, group: 'Sender')]
    public string $from_address = 'noreply@stackra.com';

    /**
     * Reply-to email address.
     *
     * The email address used in the "Reply-To" header. When set,
     * recipient replies are directed to this address instead of the
     * from address. When empty, no Reply-To header is added.
     */
    #[SettingField(controlType: ControlType::Email, label: 'Reply-To Address', validation: ['nullable', 'string', 'email', 'max:255'], sortOrder: 4, group: 'Sender')]
    public string $reply_to_address = '';

    // ──────────────────────────────────────────────────────────────
    //  SMTP
    // ──────────────────────────────────────────────────────────────

    /**
     * SMTP server hostname.
     *
     * The hostname or IP address of the SMTP server used for sending
     * emails when the `smtp` driver is selected.
     */
    #[SettingGroup(label: 'SMTP', description: 'SMTP connection and authentication settings.', icon: 'server', sortOrder: 2)]
    #[SettingField(controlType: ControlType::Text, label: 'SMTP Host', validation: ['nullable', 'string', 'max:255'], sortOrder: 1, group: 'SMTP')]
    public string $smtp_host = 'smtp.mailgun.org';

    /**
     * SMTP server port.
     *
     * The port number used to connect to the SMTP server. Common
     * values: 25 (unencrypted), 465 (SSL), 587 (TLS/STARTTLS).
     * Must be between 1 and 65535.
     */
    #[SettingField(controlType: ControlType::Number, label: 'SMTP Port', validation: ['nullable', 'integer', 'min:1', 'max:65535'], sortOrder: 2, group: 'SMTP', min: 1, max: 65535)]
    public int $smtp_port = 587;

    /**
     * SMTP encryption protocol.
     *
     * The encryption method used for the SMTP connection. Accepted
     * values: `tls` (STARTTLS on port 587), `ssl` (implicit TLS on
     * port 465), `none` (no encryption, not recommended).
     */
    #[SettingField(controlType: ControlType::Select, label: 'SMTP Encryption', validation: ['nullable', 'string', 'in:tls,ssl,none'], sortOrder: 3, group: 'SMTP', options: SmtpEncryption::class)]
    public string $smtp_encryption = 'tls';

    /**
     * SMTP authentication username.
     *
     * The username credential for SMTP server authentication. Often
     * the full email address or an API key depending on the provider.
     */
    #[SettingField(controlType: ControlType::Text, label: 'SMTP Username', validation: ['nullable', 'string', 'max:255'], sortOrder: 4, group: 'SMTP')]
    public string $smtp_username = '';

    /**
     * SMTP authentication password.
     *
     * The password credential for SMTP server authentication. Stored
     * securely and never exposed in API responses or logs.
     */
    #[SettingField(controlType: ControlType::Password, label: 'SMTP Password', validation: ['nullable', 'string', 'max:255'], sortOrder: 5, group: 'SMTP', sensitive: true)]
    public string $smtp_password = '';

    // ──────────────────────────────────────────────────────────────
    //  Mailgun
    // ──────────────────────────────────────────────────────────────

    /**
     * Mailgun sending domain.
     *
     * The verified domain configured in the Mailgun dashboard for
     * sending emails (e.g., `mg.example.com`). Required when the
     * `mailgun` driver is selected.
     */
    #[SettingGroup(label: 'Mailgun', description: 'Mailgun API credentials.', icon: 'mail', sortOrder: 3)]
    #[SettingField(controlType: ControlType::Text, label: 'Mailgun Domain', validation: ['nullable', 'string', 'max:255'], sortOrder: 1, group: 'Mailgun')]
    public string $mailgun_domain = '';

    /**
     * Mailgun API secret key.
     *
     * The private API key from the Mailgun dashboard used to
     * authenticate API requests. Stored securely and never exposed
     * in API responses or logs.
     */
    #[SettingField(controlType: ControlType::Password, label: 'Mailgun Secret', validation: ['nullable', 'string', 'max:255'], sortOrder: 2, group: 'Mailgun', sensitive: true)]
    public string $mailgun_secret = '';

    // ──────────────────────────────────────────────────────────────
    //  Amazon SES
    // ──────────────────────────────────────────────────────────────

    /**
     * AWS access key ID for SES.
     *
     * The IAM access key ID with permissions to send email via
     * Amazon Simple Email Service. Required when the `ses` driver
     * is selected.
     */
    #[SettingGroup(label: 'Amazon SES', description: 'Amazon SES credentials and region.', icon: 'cloud', sortOrder: 4)]
    #[SettingField(controlType: ControlType::Password, label: 'SES Key', validation: ['nullable', 'string', 'max:255'], sortOrder: 1, group: 'Amazon SES', sensitive: true)]
    public string $ses_key = '';

    /**
     * AWS secret access key for SES.
     *
     * The IAM secret access key paired with the access key ID.
     * Stored securely and never exposed in API responses or logs.
     */
    #[SettingField(controlType: ControlType::Password, label: 'SES Secret', validation: ['nullable', 'string', 'max:255'], sortOrder: 2, group: 'Amazon SES', sensitive: true)]
    public string $ses_secret = '';

    /**
     * AWS SES region.
     *
     * The AWS region where the SES endpoint is located (e.g.,
     * `us-east-1`, `eu-west-1`). Must match the region where
     * your SES sending identity is verified.
     */
    #[SettingField(controlType: ControlType::Text, label: 'SES Region', validation: ['nullable', 'string', 'max:50'], sortOrder: 3, group: 'Amazon SES')]
    public string $ses_region = 'us-east-1';

    /**
     * Get the Spatie Settings group identifier.
     *
     * This value is used as the database group prefix for all mail
     * setting properties (e.g., `mail.driver`, `mail.smtp_host`).
     *
     * @return string The settings group key.
     */
    public static function group(): string
    {
        return 'mail';
    }
}
