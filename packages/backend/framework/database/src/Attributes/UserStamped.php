<?php

declare(strict_types=1);

/**
 * User Stamped Attribute
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
 * UserStamped Attribute for Model Classes.
 *
 * Configures the polymorphic user-stamping columns used by the
 * {@see \Stackra\Database\Concerns\Model\HasUserStamp} trait. When
 * applied, the attribute values override the trait's hardcoded defaults,
 * allowing per-model column customisation without method overrides.
 *
 * ```php
 * #[UserStamped]
 * class Post extends Model
 * {
 *     use HasUserStamp;
 * }
 * ```
 *
 * Custom column names:
 *
 * ```php
 * #[UserStamped(
 *     createdByType: 'author_type',
 *     createdById:   'author_id',
 *     stampOnDelete:  false,
 * )]
 * class Article extends Model
 * {
 *     use HasUserStamp;
 * }
 * ```
 *
 * @category Attributes
 *
 * @since    2.0.0
 *
 * @see \Stackra\Database\Concerns\Model\HasUserStamp
 */
#[Attribute(Attribute::TARGET_CLASS)]
final readonly class UserStamped
{
    /**
     * @param  string  $createdByType  Column for the creator's morph type.
     * @param  string  $createdById    Column for the creator's morph ID.
     * @param  string  $updatedByType  Column for the updater's morph type.
     * @param  string  $updatedById    Column for the updater's morph ID.
     * @param  string  $deletedByType  Column for the deleter's morph type.
     * @param  string  $deletedById    Column for the deleter's morph ID.
     * @param  bool    $stampOnDelete  Whether to stamp on soft-delete (only if SoftDeletes is used).
     */
    public function __construct(
        public string $createdByType = 'created_by_type',
        public string $createdById = 'created_by_id',
        public string $updatedByType = 'updated_by_type',
        public string $updatedById = 'updated_by_id',
        public string $deletedByType = 'deleted_by_type',
        public string $deletedById = 'deleted_by_id',
        public bool $stampOnDelete = true,
    ) {}
}
