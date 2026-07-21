<?php

declare(strict_types=1);

namespace Stackra\Webhook\Data\Requests;

use Stackra\Webhook\Enums\WebhookDestinationKind;
use Stackra\Webhook\Rules\SupportedBackoffStrategy;
use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\Enum;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Min;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\Rule;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Attributes\Validation\Url;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated payload for `POST /api/v1/tenant/webhook/subscriptions`
 * and `POST /api/v1/platform/webhook/subscriptions`.
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class CreateWebhookSubscriptionRequestData extends Data
{
    /**
     * @param  array<string, mixed>  $destinationConfig  Driver-specific config.
     * @param  list<string>          $events             Event names to subscribe to.
     * @param  array<string, mixed>|null $backoffConfig  Strategy-specific config.
     */
    public function __construct(
        #[Required, StringType, Max(200)]
        public string $name,

        #[Required, Enum(WebhookDestinationKind::class)]
        public WebhookDestinationKind $destination,

        #[Required]
        public array $destinationConfig,

        #[Required]
        public array $events,

        #[StringType, Max(32)]
        public ?string $apiVersion = null,

        #[Min(1), Max(100000)]
        public int $rateLimitPerMinute = 60,

        #[Rule(new SupportedBackoffStrategy())]
        public string $backoffStrategy = 'static',

        public ?array $backoffConfig = null,

        #[Url, Max(2048)]
        public ?string $healthProbeUrl = null,
    ) {
    }
}
