<?php

declare(strict_types=1);

/**
 * Meta Attribute
 *
 * PHP 8 attribute for compile-time metadata annotation in the Framework module.
 * Discovered by the compiler to configure runtime behavior automatically.
 *
 * @category Attributes
 *
 * @since    1.0.0
 */
namespace Stackra\Enum\Attributes;

use Attribute;
use Stackra\Enum\Meta\Property;
use Stackra\Support\Arr;

/**
 * Meta Attribute.
 *
 * Declares which meta properties are available on an enum.
 * Must be applied to the enum class itself.
 *
 * ## Usage:
 * ```php
 * use Stackra\Enum\Attributes\Description;
 * use Stackra\Enum\Attributes\Name;
 * use Stackra\Enum\Meta\Meta;
 *
 * #[Meta([Description::class, Name::class])]
 * enum Status: string
 * {
 *     use Enum;
 *
 *     #[Name('Active Status')]
 *     #[Description('The item is active')]
 *     case ACTIVE = 'active';
 * }
 * ```
 *
 * @author  Stackra Development Team
 *
 * @since   1.0.0
 */
#[Attribute(Attribute::TARGET_CLASS)]
class Meta
{
    /**
     * List of meta property classes.
     *
     * @var array<class-string<Property>>
     */
    public array $metaProperties;

    /**
     * Create a new Meta attribute.
     *
     * @param  string|array<class-string<Property>>  ...$metaProperties  Meta property classes
     */
    public function __construct(string|array ...$metaProperties)
    {
        // When an array is passed, it'll be wrapped in an outer array due to the ...variadic parameter
        if (isset($metaProperties[0]) && is_array($metaProperties[0])) {
            // Extract the inner array
            /**
             * @var array<class-string<Property>> $extracted
             */
            $extracted = $metaProperties[0];
            $this->metaProperties = $extracted;
        } else {
            // Filter out non-string values and cast to proper type
            /**
             * @var array<class-string<Property>> $filtered
             */
            $filtered = Arr::filter($metaProperties, 'is_string');
            $this->metaProperties = $filtered;
        }
    }
}
