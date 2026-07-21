<?php

declare(strict_types=1);

namespace Stackra\ServiceAccounts\Exceptions;

use Stackra\Exceptions\Exception;

/**
 * Refused an attempt to change `tenant_id` on an existing SA row.
 *
 * `tenant_id` is set at creation and immutable thereafter — a SA
 * cannot re-parent to a different tenant. The observer catches
 * every dirty write on the column and throws this before the row
 * hits the DB.
 *
 * @category ServiceAccounts
 *
 * @since    0.1.0
 */
final class ServiceAccountTenantMutationException extends Exception
{
    /**
     * Stable machine-readable error code emitted on the JSON envelope.
     */
    public const CODE = 'SERVICE_ACCOUNT_TENANT_MUTATION';

    /**
     * Translation key for the humanised message.
     */
    public const TRANSLATION_KEY = 'service-accounts::errors.SERVICE_ACCOUNT_TENANT_MUTATION';
}
