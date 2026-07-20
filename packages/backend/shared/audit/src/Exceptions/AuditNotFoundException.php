<?php

declare(strict_types=1);

namespace Academorix\Audit\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when a lookup expects an audit row but none is bound.
 *
 * Typical trigger paths:
 *   - Route-model-binding on `/api/v1/audits/{audit}` when the id
 *     doesn't exist.
 *   - A repository finder called with an id that has already been
 *     anonymised past the 7y retention boundary.
 *
 * @category Audit
 *
 * @since    0.1.0
 */
final class AuditNotFoundException extends AcademorixException
{
    public const CODE = 'audit.not_found';

    public const TRANSLATION_KEY = 'audit::errors.not_found';
}
