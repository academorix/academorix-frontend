<?php

declare(strict_types=1);

/**
 * Status Column Attribute
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
 * StatusColumn Attribute for Model Classes.
 *
 * Configures enum-based status management for the
 * {@see \Stackra\Database\Concerns\Model\HasStatus} trait. When applied,
 * the attribute values override the trait's method-based defaults,
 * removing the need for the abstract `statusEnum()` method.
 *
 * ```php
 * #[StatusColumn(enum: OrderStatus::class)]
 * class Order extends Model
 * {
 *     use HasStatus;
 * }
 * ```
 *
 * Custom column and default value:
 *
 * ```php
 * #[StatusColumn(
 *     enum:    TicketPriority::class,
 *     column:  'priority',
 *     default: 'low',
 * )]
 * class Ticket extends Model
 * {
 *     use HasStatus;
 * }
 * ```
 *
 * @category Attributes
 *
 * @since    2.0.0
 *
 * @see \Stackra\Database\Concerns\Model\HasStatus
 */
#[Attribute(Attribute::TARGET_CLASS)]
final readonly class StatusColumn
{
    /**
     * @param  string       $enum     The fully qualified BackedEnum class name (required).
     * @param  string       $column   Column that stores the status value.
     * @param  string|null  $default  Default status value (null = first enum case).
     */
    public function __construct(
        public string $enum,
        public string $column = 'status',
        public ?string $default = null,
    ) {}
}
