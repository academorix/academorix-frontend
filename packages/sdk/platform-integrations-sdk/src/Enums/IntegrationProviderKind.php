<?php

declare(strict_types=1);

namespace Academorix\PlatformIntegrationsSdk\Enums;

/**
 * Wire-visible backed enum for `integration-provider.kind`.
 *
 * Backing type: string. Values are the exact snake_case tokens
 * the server emits.
 *
 * @category IntegrationsSdk
 *
 * @since    0.1.0
 */
enum IntegrationProviderKind: string
{
    case Payment = 'payment';
    case Crm = 'crm';
    case Email = 'email';
    case Sms = 'sms';
    case Calendar = 'calendar';
    case Chat = 'chat';
    case Wallet = 'wallet';
    case Accounting = 'accounting';
    case Webhook = 'webhook';
    case Sso = 'sso';
    case Video = 'video';
    case Storage = 'storage';
}
