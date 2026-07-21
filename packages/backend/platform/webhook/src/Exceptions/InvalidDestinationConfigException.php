<?php

declare(strict_types=1);

namespace Stackra\Webhook\Exceptions;

use Stackra\Exceptions\Exception;

/**
 * Raised when `destination_config` is missing a required key for the
 * selected destination driver (e.g. `url` for `https`, `region` for
 * `eventbridge`).
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
final class InvalidDestinationConfigException extends Exception
{
    public const CODE = 'webhook.invalid_destination_config';

    public const TRANSLATION_KEY = 'webhook::errors.invalid_destination_config';
}
