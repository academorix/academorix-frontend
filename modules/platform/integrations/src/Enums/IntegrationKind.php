<?php

declare(strict_types=1);

namespace Academorix\Integrations\Enums;

use Academorix\Enum\Attributes\Description;
use Academorix\Enum\Attributes\Label;
use Academorix\Enum\Attributes\Meta;
use Academorix\Enum\Enum;

/**
 * Category of third-party integration a Tenant has configured.
 *
 * The `kind` column carries the backing value; the provider-specific
 * driver bundle (Okta vs Azure AD vs OneLogin) sits on the sibling
 * `provider` column and is validated against
 * `config('integrations.providers')`.
 *
 * ## Cases
 *
 *  * {@see self::SsoSaml} — SAML 2.0 identity provider.
 *  * {@see self::SsoOidc} — OIDC identity provider.
 *  * {@see self::Scim}    — SCIM 2.0 directory sync.
 *  * {@see self::Hris}    — HR information system (Workday, Rippling, ...).
 *  * {@see self::Lms}     — Learning management system (Canvas, Moodle, ...).
 *  * {@see self::Webhook} — Generic outbound webhook target (Zapier, n8n).
 *  * {@see self::Sms}     — SMS gateway (Twilio, MessageBird, ...).
 *  * {@see self::Email}   — Transactional email gateway (SendGrid, Postmark, ...).
 *
 * @category Integrations
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum IntegrationKind: string
{
    use Enum;

    #[Label('SSO — SAML')]
    #[Description('SAML 2.0 identity provider (Okta, Azure AD, OneLogin, custom).')]
    case SsoSaml = 'sso_saml';

    #[Label('SSO — OIDC')]
    #[Description('OIDC identity provider (Okta, Azure AD, Auth0, custom).')]
    case SsoOidc = 'sso_oidc';

    #[Label('SCIM')]
    #[Description('SCIM 2.0 directory-sync source. Push-based user/group provisioning.')]
    case Scim = 'scim';

    #[Label('HRIS')]
    #[Description('HR information system (Workday, Rippling, BambooHR, Gusto, ADP).')]
    case Hris = 'hris';

    #[Label('LMS')]
    #[Description('Learning management system (Canvas, Blackboard, Moodle, PowerSchool, Schoology).')]
    case Lms = 'lms';

    #[Label('Webhook')]
    #[Description('Generic outbound webhook (Zapier, Make, n8n, or custom endpoint).')]
    case Webhook = 'webhook';

    #[Label('SMS')]
    #[Description('SMS gateway (Twilio, MessageBird, Vonage, AWS SNS).')]
    case Sms = 'sms';

    #[Label('Email')]
    #[Description('Transactional email gateway (SendGrid, Postmark, Mailgun, AWS SES, Resend).')]
    case Email = 'email';
}
