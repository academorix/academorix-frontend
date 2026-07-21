<?php

declare(strict_types=1);

namespace Stackra\Tenancy\Exceptions;

use Stackra\Exceptions\AcademorixException;

/**
 * Raised when a caller attempts to register a tenant with a reserved
 * slug (www, api, admin, mail, blog, platform, app, static, cdn,
 * help, support, status).
 *
 * Enforced by {@see \Stackra\Tenancy\Rules\ReservedSlug} validation
 * rule; the full list lives in `config/tenancy.php` under
 * `tenants.hosts.reserved_slugs`.
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
final class SlugReservedException extends AcademorixException
{
    public const CODE = 'tenancy.slug_reserved';

    public const TRANSLATION_KEY = 'tenancy::errors.slug_reserved';
}
