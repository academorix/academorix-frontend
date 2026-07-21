<?php

declare(strict_types=1);

/**
 * Json
 *
 * Provides Json functionality within the Framework module.
 * Part of the module's core infrastructure for handling domain operations.
 *
 * @category Facades
 *
 * @since    1.0.0
 */
namespace Stackra\Support\Facades;

use Illuminate\Support\Facades\Facade;
use Stackra\Serializer\Contracts\JsonInterface;

/**
 * Json Facade.
 *
 * Provides a static interface to the serialization and deserialization methods defined in the JsonInterface.
 *
 * @method static|false encode(mixed $data, int $options = 0, int $depth = 512) Encode the given data into a JSON string format.
 * @method static mixed decode(string $string, bool $associative = false, int $depth = 512, int $options = 0) Decode the given JSON string back into its original data format.
 * @method static bool isValid(string $json) Check if the given string is a valid JSON formatted string.
 *
 * @see JsonInterface
 */
class Json extends Facade
{
    /**
     * Get the registered name of the component.
     */
    protected static function getFacadeAccessor(): string
    {
        return JsonInterface::class;
    }
}
