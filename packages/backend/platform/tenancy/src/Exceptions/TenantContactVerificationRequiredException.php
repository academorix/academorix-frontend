<?php

declare(strict_types=1);

namespace Stackra\Tenancy\Exceptions;

use Stackra\Exceptions\AcademorixException;

/**
 * Raised when a `kind = dpo` or `kind = legal` contact is promoted to
 * primary before `verified_at` is set.
 *
 * GDPR + legal precedence requires we do not blindly trust unverified
 * DPO / legal addresses. Enforced by `TenantContactObserver::saving()`.
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
final class TenantContactVerificationRequiredException extends AcademorixException
{
    public const CODE = 'tenancy.contact_verification_required';

    public const TRANSLATION_KEY = 'tenancy::errors.contact_verification_required';
}
