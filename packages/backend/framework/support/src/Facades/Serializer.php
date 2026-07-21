<?php

declare(strict_types=1);

/**
 * Serializer
 *
 * Provides Serializer functionality within the Framework module.
 * Part of the module's core infrastructure for handling domain operations.
 *
 * @category Facades
 *
 * @since    1.0.0
 */
namespace Stackra\Support\Facades;

use Illuminate\Support\Facades\Facade;
use Stackra\Serializer\Contracts\SerializerInterface;

/**
 * Serializer Facade.
 *
 * Provides a static interface to the serialization and deserialization methods defined in the SerializerInterface.
 *
 * @method static ?string serialize(mixed $data) Serializer the given data into a serialized string format.
 * @method static mixed unserialize($string, bool $allowedClasses = false) Unserialize the given serialized string back into its original data format.
 *
 * @see SerializerInterface
 */
class Serializer extends Facade
{
    /**
     * Get the registered name of the component.
     */
    protected static function getFacadeAccessor(): string
    {
        return SerializerInterface::class;
    }
}
