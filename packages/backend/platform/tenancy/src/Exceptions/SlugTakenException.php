<?php

declare(strict_types=1);

namespace Stackra\Tenancy\Exceptions;

use Stackra\Exceptions\StackraException;

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
final class SlugTakenException extends StackraException
{
    public const CODE = 'tenancy.slug_taken';

    public const TRANSLATION_KEY = 'tenancy::errors.slug_taken';
}
