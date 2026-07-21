<?php

declare(strict_types=1);

namespace Stackra\PlatformIntegrationsSdk\Enums;

/**
 * Wire-visible backed enum for `app.status`.
 *
 * Backing type: string. Values are the exact snake_case tokens
 * the server emits.
 *
 * @category IntegrationsSdk
 *
 * @since    0.1.0
 */
enum AppStatus: string
{
    case Draft = 'draft';
    case InReview = 'in_review';
    case Approved = 'approved';
    case Suspended = 'suspended';
    case Retired = 'retired';
}
