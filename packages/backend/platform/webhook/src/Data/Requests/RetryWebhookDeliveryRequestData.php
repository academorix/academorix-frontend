<?php

declare(strict_types=1);

namespace Academorix\Webhook\Data\Requests;

use Spatie\LaravelData\Data;

/**
 * Empty body for
 * `POST /api/v1/tenant/webhook/deliveries/{id}/retry`.
 *
 * The delivery id comes from the URL; the body carries no fields. The
 * DTO exists so the action has a typed input to inject and Spatie
 * validation runs (even against `{}`).
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
final class RetryWebhookDeliveryRequestData extends Data
{
    public function __construct()
    {
    }
}
