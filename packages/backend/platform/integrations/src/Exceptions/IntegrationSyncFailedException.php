<?php

declare(strict_types=1);

namespace Stackra\Integrations\Exceptions;

use Stackra\Exceptions\Exception;

/**
 * Raised when a {@see \Stackra\Integrations\Jobs\SyncIntegrationJob}
 * run fails at the driver level. Payload carries the provider error
 * string so the failure event surfaces the reason.
 *
 * @category Integrations
 *
 * @since    0.1.0
 */
final class IntegrationSyncFailedException extends Exception
{
    public const CODE = 'integrations.sync_failed';

    public const TRANSLATION_KEY = 'integrations::errors.sync_failed';
}
