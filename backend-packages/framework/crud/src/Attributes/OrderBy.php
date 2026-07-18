<?php

declare(strict_types=1);

/**
 * Order By Attribute
 *
 * PHP 8 attribute for compile-time metadata annotation in the Framework module.
 * Discovered by the compiler to configure runtime behavior automatically.
 *
 * @category Attributes
 *
 * @since    1.0.0
 */
namespace Academorix\Crud\Attributes;

use Attribute;

/**
 * OrderBy Attribute for Repository Classes.
 *
 * Declares a default ordering clause applied to every query. Repeatable —
 * multiple #[OrderBy] attributes stack in declaration order.
 *
 * @since 2.0.0
 */
#[Attribute(Attribute::TARGET_CLASS | Attribute::IS_REPEATABLE)]
final readonly class OrderBy
{
    /**
     * @param  string  $column  The column to order by.
     * @param  string  $direction  The sort direction (asc|desc).
     */
    public function __construct(
        public string $column,
        public string $direction = 'asc',
    ) {}
}
