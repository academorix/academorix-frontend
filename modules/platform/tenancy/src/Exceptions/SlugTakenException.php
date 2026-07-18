<?php

declare(strict_types=1);

namespace Academorix\Tenancy\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when a caller attempts to register a tenant with a slug
 * already in use in the target Application.
 *
 * The `(application_id, slug)` unique index enforces the invariant at
 * the DB level; this exception is the humanised surface.
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
final class SlugTakenException extends AcademorixException
{
    public const CODE = 'tenancy.slug_taken';

    public const TRANSLATION_KEY = 'tenancy::errors.slug_taken';
}
