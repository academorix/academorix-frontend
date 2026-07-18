<?php

declare(strict_types=1);

namespace Academorix\Webhook\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when a delivery attempt fails and needs a domain-level
 * surface (test dispatch, manual retry). Not thrown from the async
 * dispatcher — the job records failure state on the delivery row.
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
final class WebhookDeliveryFailedException extends AcademorixException
{
    public const CODE = 'webhook.delivery_failed';

    public const TRANSLATION_KEY = 'webhook::errors.delivery_failed';
}
