<?php

declare(strict_types=1);

namespace Academorix\PlatformIntegrationsSdk\Enums;

/**
 * Wire-visible backed enum for `app-installation.status`.
 *
 * Backing type: string. Values are the exact snake_case tokens
 * the server emits.
 *
 * @category IntegrationsSdk
 *
 * @since    0.1.0
 */
enum AppInstallationStatus: string
{
    case Active = 'active';
    case Suspended = 'suspended';
    case Revoked = 'revoked';
}
