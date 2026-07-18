<?php

declare(strict_types=1);

namespace Academorix\Subscription\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when the platform admin's enterprise invoice request is
 * malformed (missing PO number, invalid due date, plan not marked
 * `billing_mode=invoice`). HTTP 422.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
final class EnterpriseInvoiceInvalidException extends AcademorixException
{
    /**
     * Stable machine-readable error code emitted on the JSON envelope.
     */
    public const CODE = 'subscription.enterprise_invoice_invalid';

    /**
     * Translation key for the humanised message.
     */
    public const TRANSLATION_KEY = 'subscription::errors.enterprise_invoice_invalid';
}
