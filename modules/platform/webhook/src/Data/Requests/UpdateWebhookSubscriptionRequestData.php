<?php

declare(strict_types=1);

namespace Academorix\Webhook\Data\Requests;

use Academorix\Webhook\Rules\SupportedBackoffStrategy;
use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Min;
use Spatie\LaravelData\Attributes\Validation\Rule;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Attributes\Validation\Url;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;
use Spatie\LaravelData\Optional;

/**
 * Validated payload for `PATCH /api/v1/tenant/webhook/subscriptions/{id}`.
 *
 * Every field is `Optional` — callers PATCH only the fields they want
 * to change. Destination + events are intentionally omitted (changing
 * them creates a new subscription rather than mutating in place).
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class UpdateWebhookSubscriptionRequestData extends Data
{
    /**
     * @param  string|Optional        $name                Human label.
     * @param  string|Optional        $apiVersion          Pinned API version.
     * @param  int|Optional           $rateLimitPerMinute  Rate limit override.
     * @param  string|Optional        $backoffStrategy     Backoff-strategy key.
     * @param  array<string, mixed>|null|Optional $backoffConfig  Strategy config.
     * @param  string|null|Optional   $healthProbeUrl      Probe URL.
     */
    public function __construct(
        #[StringType, Max(200)]
        public string|Optional $name = new Optional(),

        #[StringType, Max(32)]
        public string|Optional $apiVersion = new Optional(),

        #[Min(1), Max(100000)]
        public int|Optional $rateLimitPerMinute = new Optional(),

        #[StringType, Rule(new SupportedBackoffStrategy())]
        public string|Optional $backoffStrategy = new Optional(),

        public array|null|Optional $backoffConfig = new Optional(),

        #[Url, Max(2048)]
        public string|null|Optional $healthProbeUrl = new Optional(),
    ) {
    }
}
