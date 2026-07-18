<?php

declare(strict_types=1);

/**
 * Uuid Column Attribute
 *
 * PHP 8 attribute for compile-time metadata annotation in the Framework module.
 * Discovered by the compiler to configure runtime behavior automatically.
 *
 * @category Attributes
 *
 * @since    1.0.0
 */
namespace Academorix\Database\Attributes;

use Attribute;

/**
 * UuidColumn Attribute for Model Classes.
 *
 * Configures UUID generation behaviour for the
 * {@see \Academorix\Database\Concerns\Model\HasUuid} trait. When applied,
 * the attribute values override the trait's method-based defaults.
 *
 * ```php
 * #[UuidColumn]
 * class Post extends Model
 * {
 *     use HasUuid;
 * }
 * ```
 *
 * UUID as primary key:
 *
 * ```php
 * #[UuidColumn(column: 'id', asKey: true)]
 * class Token extends Model
 * {
 *     use HasUuid;
 * }
 * ```
 *
 * @category Attributes
 *
 * @since    2.0.0
 *
 * @see \Academorix\Database\Concerns\Model\HasUuid
 */
#[Attribute(Attribute::TARGET_CLASS)]
final readonly class UuidColumn
{
    /**
     * @param  string  $column  Column name that stores the UUID.
     * @param  bool    $asKey   Whether to use the UUID as the primary key.
     */
    public function __construct(
        public string $column = 'uuid',
        public bool $asKey = false,
    ) {}
}
