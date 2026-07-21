<?php

declare(strict_types=1);

/**
 * AuthSettings — Authentication and Security Policies.
 *
 * Defines the canonical schema for authentication and security settings
 * within the Unified Settings System. These settings control session
 * management, password complexity requirements, account lockout behavior,
 * multi-factor authentication enforcement, and registration policies.
 *
 * Properties are organized into logical groups:
 *
 * - **Session** — Session lifetime, remember-me duration, and single-session enforcement.
 * - **Password Policy** — Minimum length, character requirements, and expiry.
 * - **Lockout** — Failed login attempt limits and lockout duration.
 * - **Multi-Factor Authentication** — MFA enable/enforce toggles.
 * - **Registration & Providers** — Allowed auth providers, registration, and email verification.
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

/**
 * Authentication and Security Settings.
 *
 * Stores security-related configuration values that govern how users
 * authenticate, how sessions are managed, and what password policies
 * are enforced. Scoped to the tenant level, allowing each tenant to
 * define their own security posture.
 *
 * **Session:**
 * - `session_lifetime_minutes`: How long a session remains active before expiry.
 * - `remember_me_lifetime_days`: Duration of persistent "remember me" sessions.
 * - `single_session`: Whether to restrict users to a single active session.
 *
 * **Password Policy:**
 * - `password_min_length`: Minimum number of characters required.
 * - `password_require_uppercase`: Whether at least one uppercase letter is required.
 * - `password_require_number`: Whether at least one numeric digit is required.
 * - `password_require_symbol`: Whether at least one special character is required.
 * - `password_expiry_days`: Days before a password must be changed (0 = never).
 *
 * **Lockout:**
 * - `max_login_attempts`: Number of failed attempts before account lockout.
 * - `lockout_duration_minutes`: How long the account remains locked.
 *
 * **Multi-Factor Authentication:**
 * - `mfa_enabled`: Whether MFA is available as an option for users.
 * - `mfa_enforced`: Whether MFA is mandatory for all users.
 *
 * **Registration & Providers:**
 * - `allowed_auth_providers`: Comma-separated list of enabled auth providers.
 * - `registration_enabled`: Whether new user self-registration is allowed.
 * - `email_verification_required`: Whether email verification is required after registration.
 */
#[AsSetting(group: 'auth', label: 'Authentication', description: 'Authentication and security policies.', icon: 'shield', scope: 'tenant', sortOrder: 2)]
class AuthSettings extends Settings
{
    // ──────────────────────────────────────────────────────────────
    //  Session
    // ──────────────────────────────────────────────────────────────

    /**
     * Session lifetime in minutes.
     *
     * The number of minutes a user session remains active before
     * requiring re-authentication. Applies to standard (non-remember-me)
     * sessions. Must be between 5 and 10,080 minutes (7 days).
     */
    #[SettingGroup(label: 'Session', description: 'Session lifetime and persistence settings.', icon: 'clock', sortOrder: 1)]
    #[SettingField(controlType: ControlType::Number, label: 'Session Lifetime (minutes)', validation: ['nullable', 'integer', 'min:5', 'max:10080'], sortOrder: 1, group: 'Session', min: 5, max: 10080)]
    public int $session_lifetime_minutes = 120;

    /**
     * Remember-me session lifetime in days.
     *
     * The number of days a persistent "remember me" session remains
     * valid. When a user checks "remember me" during login, their
     * session persists for this duration. Must be between 1 and 365 days.
     */
    #[SettingField(controlType: ControlType::Number, label: 'Remember Me Lifetime (days)', validation: ['nullable', 'integer', 'min:1', 'max:365'], sortOrder: 2, group: 'Session', min: 1, max: 365)]
    public int $remember_me_lifetime_days = 30;

    /**
     * Single session enforcement.
     *
     * When enabled, each user is restricted to a single active session.
     * Logging in from a new device or browser invalidates all previous
     * sessions for that user.
     */
    #[SettingField(controlType: ControlType::Toggle, label: 'Single Session', validation: ['nullable', 'boolean'], sortOrder: 3, group: 'Session')]
    public bool $single_session = false;

    // ──────────────────────────────────────────────────────────────
    //  Password Policy
    // ──────────────────────────────────────────────────────────────

    /**
     * Minimum password length.
     *
     * The minimum number of characters required for user passwords.
     * Enforced during registration, password change, and password
     * reset flows. Must be between 6 and 128 characters.
     */
    #[SettingGroup(label: 'Password Policy', description: 'Password complexity and expiration rules.', icon: 'key', sortOrder: 2)]
    #[SettingField(controlType: ControlType::Number, label: 'Minimum Length', validation: ['nullable', 'integer', 'min:6', 'max:128'], sortOrder: 1, group: 'Password Policy', min: 6, max: 128)]
    public int $password_min_length = 8;

    /**
     * Require uppercase letter in passwords.
     *
     * When enabled, passwords must contain at least one uppercase
     * letter (A–Z). Enforced during registration, password change,
     * and password reset flows.
     */
    #[SettingField(controlType: ControlType::Toggle, label: 'Require Uppercase', validation: ['nullable', 'boolean'], sortOrder: 2, group: 'Password Policy')]
    public bool $password_require_uppercase = true;

    /**
     * Require numeric digit in passwords.
     *
     * When enabled, passwords must contain at least one numeric
     * digit (0–9). Enforced during registration, password change,
     * and password reset flows.
     */
    #[SettingField(controlType: ControlType::Toggle, label: 'Require Number', validation: ['nullable', 'boolean'], sortOrder: 3, group: 'Password Policy')]
    public bool $password_require_number = true;

    /**
     * Require special character in passwords.
     *
     * When enabled, passwords must contain at least one special
     * character (e.g., `!@#$%^&*`). Enforced during registration,
     * password change, and password reset flows.
     */
    #[SettingField(controlType: ControlType::Toggle, label: 'Require Symbol', validation: ['nullable', 'boolean'], sortOrder: 4, group: 'Password Policy')]
    public bool $password_require_symbol = false;

    /**
     * Password expiry period in days.
     *
     * The number of days before a password must be changed. When set
     * to 0, passwords never expire. Users are prompted to change their
     * password when it reaches the expiry threshold. Must be between
     * 0 and 365 days.
     */
    #[SettingField(controlType: ControlType::Number, label: 'Password Expiry (days)', validation: ['nullable', 'integer', 'min:0', 'max:365'], sortOrder: 5, group: 'Password Policy', min: 0, max: 365)]
    public int $password_expiry_days = 0;

    // ──────────────────────────────────────────────────────────────
    //  Lockout
    // ──────────────────────────────────────────────────────────────

    /**
     * Maximum failed login attempts before lockout.
     *
     * The number of consecutive failed login attempts allowed before
     * the account is temporarily locked. After lockout, the user must
     * wait for the lockout duration to expire or contact an admin.
     * Must be between 1 and 20 attempts.
     */
    #[SettingGroup(label: 'Lockout', description: 'Account lockout thresholds and duration.', icon: 'lock', sortOrder: 3)]
    #[SettingField(controlType: ControlType::Number, label: 'Max Login Attempts', validation: ['nullable', 'integer', 'min:1', 'max:20'], sortOrder: 1, group: 'Lockout', min: 1, max: 20)]
    public int $max_login_attempts = 5;

    /**
     * Account lockout duration in minutes.
     *
     * The number of minutes an account remains locked after exceeding
     * the maximum login attempts. After this period, the user can
     * attempt to log in again. Must be between 1 and 1,440 minutes (24 hours).
     */
    #[SettingField(controlType: ControlType::Number, label: 'Lockout Duration (minutes)', validation: ['nullable', 'integer', 'min:1', 'max:1440'], sortOrder: 2, group: 'Lockout', min: 1, max: 1440)]
    public int $lockout_duration_minutes = 15;

    // ──────────────────────────────────────────────────────────────
    //  Multi-Factor Authentication
    // ──────────────────────────────────────────────────────────────

    /**
     * MFA availability toggle.
     *
     * When enabled, multi-factor authentication is available as an
     * option for users to configure in their account settings. This
     * does not force users to enable MFA — see `mfa_enforced` for
     * mandatory enforcement.
     */
    #[SettingGroup(label: 'Multi-Factor Authentication', description: 'MFA availability and enforcement settings.', icon: 'shield-check', sortOrder: 4)]
    #[SettingField(controlType: ControlType::Toggle, label: 'MFA Enabled', validation: ['nullable', 'boolean'], sortOrder: 1, group: 'Multi-Factor Authentication')]
    public bool $mfa_enabled = false;

    /**
     * MFA enforcement toggle.
     *
     * When enabled, all users are required to configure and use
     * multi-factor authentication. Users without MFA configured are
     * redirected to the MFA setup flow on login. Requires `mfa_enabled`
     * to be `true` to take effect.
     */
    #[SettingField(controlType: ControlType::Toggle, label: 'MFA Enforced', validation: ['nullable', 'boolean'], sortOrder: 2, group: 'Multi-Factor Authentication')]
    public bool $mfa_enforced = false;

    // ──────────────────────────────────────────────────────────────
    //  Registration & Providers
    // ──────────────────────────────────────────────────────────────

    /**
     * Allowed authentication providers.
     *
     * Comma-separated list of enabled authentication providers
     * (e.g., `email`, `email,google`, `email,google,github`).
     * Controls which login methods are available on the login page
     * and which OAuth/SSO integrations are active.
     */
    #[SettingGroup(label: 'Registration & Providers', description: 'Auth providers, registration, and email verification.', icon: 'users', sortOrder: 5)]
    #[SettingField(controlType: ControlType::Text, label: 'Allowed Auth Providers', validation: ['nullable', 'string', 'max:200'], sortOrder: 1, group: 'Registration & Providers')]
    public string $allowed_auth_providers = 'email';

    /**
     * User self-registration toggle.
     *
     * When enabled, new users can create accounts through the
     * registration page. When disabled, accounts can only be
     * created by administrators.
     */
    #[SettingField(controlType: ControlType::Toggle, label: 'Registration Enabled', validation: ['nullable', 'boolean'], sortOrder: 2, group: 'Registration & Providers')]
    public bool $registration_enabled = true;

    /**
     * Email verification requirement.
     *
     * When enabled, newly registered users must verify their email
     * address before gaining full access to the application. An
     * email with a verification link is sent upon registration.
     */
    #[SettingField(controlType: ControlType::Toggle, label: 'Email Verification Required', validation: ['nullable', 'boolean'], sortOrder: 3, group: 'Registration & Providers')]
    public bool $email_verification_required = true;

    /**
     * Get the Spatie Settings group identifier.
     *
     * This value is used as the database group prefix for all auth
     * setting properties (e.g., `auth.session_lifetime_minutes`,
     * `auth.password_min_length`).
     *
     * @return string The settings group key.
     */
    public static function group(): string
    {
        return 'auth';
    }
}
