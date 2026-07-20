<?php

declare(strict_types=1);

namespace Academorix\PlatformIntegrationsSdk\Enums;

/**
 * Wire-visible backed enum for `app.pricing_model`.
 *
 * Backing type: string. Values are the exact snake_case tokens
 * the server emits.
 *
 * @category IntegrationsSdk
 *
 * @since    0.1.0
 */
enum AppPricingModel: string
{
    case Free = 'free';
    case OneTime = 'one_time';
    case Recurring = 'recurring';
    case UsageBased = 'usage_based';
}
