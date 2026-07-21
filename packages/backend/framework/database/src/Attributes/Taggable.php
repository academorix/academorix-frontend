<?php

declare(strict_types=1);

/**
 * Taggable Attribute
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
 * Taggable Attribute for Model Classes.
 *
 * Configures the polymorphic tagging relationship for the
 * {@see \Stackra\Database\Concerns\Model\HasTags} trait. When applied,
 * the attribute values override the trait's method-based defaults.
 *
 * ```php
 * #[Taggable]
 * class Post extends Model
 * {
 *     use HasTags;
 * }
 * ```
 *
 * Custom tag model and pivot table:
 *
 * ```php
 * #[Taggable(
 *     tagModel:   'App\\Models\\Label',
 *     pivotTable: 'labelables',
 * )]
 * class Issue extends Model
 * {
 *     use HasTags;
 * }
 * ```
 *
 * @category Attributes
 *
 * @since    2.0.0
 *
 * @see \Stackra\Database\Concerns\Model\HasTags
 */
#[Attribute(Attribute::TARGET_CLASS)]
final readonly class Taggable
{
    /**
     * @param  string  $tagModel    Fully qualified class name of the Tag model.
     * @param  string  $pivotTable  Name of the polymorphic pivot table.
     */
    public function __construct(
        public string $tagModel = 'Stackra\\Crud\\Models\\Tag',
        public string $pivotTable = 'taggables',
    ) {}
}
