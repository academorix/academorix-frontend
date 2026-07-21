<?php

declare(strict_types=1);

namespace Stackra\Geography\Exceptions;

use Stackra\Exceptions\Exception;

/**
 * Raised when the health probe detects the vendor seeder never ran.
 * Operator fix: `php artisan world:install`.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
final class GeographyWorldNotSeededException extends Exception
{
    public const CODE = 'GEOGRAPHY_WORLD_NOT_SEEDED';

    public const TRANSLATION_KEY = 'geography::errors.world_not_seeded';
}
