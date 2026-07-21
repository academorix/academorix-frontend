<?php

declare(strict_types=1);

/**
 * Sortable Model Attribute
 *
 * PHP 8 attribute for compile-time metadata annotation in the Framework module.
 * Discovered by the compiler to configure runtime behavior automatically.
 *
 * @category Attributes
 *
 * @since    1.0.0
 */
namespace Stackra\Database\Attributes;

use Attribute;

/**
 * SortableModel Attribute for Model Classes.
 *
 * Configures positional ordering behaviour for the
 * {@see \Stackra\Database\Concerns\Model\HasSortOrder} trait. When
 * applied, the attribute values override the trait's method-based
 * defaults, allowing per-model sort configuration via a single attribute.
 *
 * ```php
 * #[SortableModel]
 * class MenuItem extends Model
 * {
 *     use HasSortOrder;
 * }
 * ```
 *
 * Grouped ordering:
 *
 * ```php
 * #[SortableModel(column: 'position', group: ['menu_id'])]
 * class MenuItem extends Model
 * {
 *     use HasSortOrder;
 * }
 * ```
 *
 * @category Attributes
 *
 * @since    2.0.0
 *
 * @see \Stackra\Database\Concerns\Model\HasSortOrder
 */
#[Attribute(Attribute::TARGET_CLASS)]
final readonly class SortableModel
{
    /**
     * @param  string        $column  Column name used for sort ordering.
     * @param  array<string> $group   Columns that define the ordering group (e.g., ['category_id']).
     */
    public function __construct(
        public string $column = 'sort_order',
        public array $group = [],
    ) {}
}
