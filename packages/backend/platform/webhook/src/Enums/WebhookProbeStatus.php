<?php

declare(strict_types=1);

namespace Stackra\Webhook\Enums;

use Stackra\Enum\Attributes\Description;
use Stackra\Enum\Attributes\Label;
use Stackra\Enum\Attributes\Meta;
use Stackra\Enum\Enum;

/**
 * Outcome of the most recent health probe on a subscription.
 *
 * ## Cases
 *
 *  * {@see self::Unknown}   — the probe has never run for this subscription.
 *  * {@see self::Healthy}   — last probe returned a 2xx status.
 *  * {@see self::Unhealthy} — last probe returned a non-2xx or timed out.
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum WebhookProbeStatus: string
{
    use Enum;

    #[Label('Unknown')]
    #[Description('The health probe has never run for this subscription.')]
    case Unknown = 'unknown';

    #[Label('Healthy')]
    #[Description('The most recent health probe returned a 2xx status.')]
    case Healthy = 'healthy';

    #[Label('Unhealthy')]
    #[Description('The most recent health probe returned a non-2xx status or timed out.')]
    case Unhealthy = 'unhealthy';
}
