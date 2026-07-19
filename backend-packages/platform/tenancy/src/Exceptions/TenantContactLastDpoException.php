<?php

declare(strict_types=1);

namespace Academorix\Tenancy\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when a caller attempts to delete the last remaining DPO
 * contact for a GDPR-subject tenant.
 *
 * GDPR Art. 30 requires the DPO contact to be retained for 6 years
 * after processing ends; the policy refuses the delete rather than
 * silently orphaning the tenant.
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
final class TenantContactLastDpoException extends AcademorixException
{
    public const CODE = 'tenancy.contact_last_dpo';

    public const TRANSLATION_KEY = 'tenancy::errors.contact_last_dpo';
}
