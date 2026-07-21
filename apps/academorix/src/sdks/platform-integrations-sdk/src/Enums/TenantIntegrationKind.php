<?php

declare(strict_types=1);

namespace Stackra\PlatformIntegrationsSdk\Enums;

/**
 * Wire-visible backed enum for `tenant-integration.kind`.
 *
 * Backing type: string. Values are the exact snake_case tokens
 * the server emits.
 *
 * @category IntegrationsSdk
 *
 * @since    0.1.0
 */
enum TenantIntegrationKind: string
{
    case SsoSaml = 'sso_saml';
    case SsoOidc = 'sso_oidc';
    case Scim = 'scim';
    case Hris = 'hris';
    case Lms = 'lms';
    case Webhook = 'webhook';
    case Sms = 'sms';
    case Email = 'email';
}
