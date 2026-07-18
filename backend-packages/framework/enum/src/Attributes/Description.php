<?php

declare(strict_types=1);

/**
 * Description Attribute
 *
 * PHP 8 attribute for compile-time metadata annotation in the Framework module.
 * Discovered by the compiler to configure runtime behavior automatically.
 *
 * @category Attributes
 *
 * @since    1.0.0
 */
namespace Academorix\Enum\Attributes;

use Attribute;
use Academorix\Enum\Meta\Property;

/**
 * Description Attribute.
 *
 * Attaches a description to an enum case.
 *
 * ## Usage:
 * ```php
 * use Academorix\Enum\Attributes\Description;
 * use Academorix\Enum\Meta\Meta;
 *
 * #[Meta([Description::class])]
 * enum Status: string
 * {
 *     use Enum;
 *
 *     #[Description('The item is currently active and available')]
 *     case ACTIVE = 'active';
 *
 *     #[Description('The item is currently inactive and unavailable')]
 *     case INACTIVE = 'inactive';
 * }
 *
 * Status::ACTIVE()->description(); // Returns 'The item is currently active and available'
 * ```
 *
 * @author  Academorix Development Team
 *
 * @since   1.0.0
 */
#[Attribute(Attribute::TARGET_CLASS_CONSTANT)]
class Description extends Property
{
    /**
     * Get the default description when not specified.
     *
     * @return string Empty string as default
     */
    public static function defaultValue(): mixed
    {
        return '';
    }
}
