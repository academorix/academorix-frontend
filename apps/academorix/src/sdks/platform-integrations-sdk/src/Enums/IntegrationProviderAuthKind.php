<?php

declare(strict_types=1);

namespace Stackra\PlatformIntegrationsSdk\Enums;

/**
 * Wire-visible backed enum for `integration-provider.auth_kind`.
 *
 * Backing type: string. Values are the exact snake_case tokens
 * the server emits.
 *
 * @category IntegrationsSdk
 *
 * @since    0.1.0
 */
enum IntegrationProviderAuthKind: string
{
    case Oauth2 = 'oauth2';
    case ApiKey = 'api_key';
    case Basic = 'basic';
    case WebhookOnly = 'webhook_only';
}
