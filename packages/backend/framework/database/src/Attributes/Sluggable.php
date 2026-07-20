<?php

declare(strict_types=1);

/**
 * Sluggable Attribute
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
 * Sluggable Attribute for Model Classes.
 *
 * Configures slug generation behaviour for the
 * {@see \Academorix\Database\Concerns\Model\HasSlug} trait. When applied,
 * the attribute values override the trait's method-based defaults,
 * allowing per-model slug customisation via a single attribute.
 *
 * ```php
 * #[Sluggable(source: 'title')]
 * class Post extends Model
 * {
 *     use HasSlug;
 * }
 * ```
 *
 * Full customisation:
 *
 * ```php
 * #[Sluggable(
 *     source:              'full_name',
 *     column:              'url_slug',
 *     separator:           '_',
 *     unique:              true,
 *     regenerateOnUpdate:  false,
 *     routeBinding:        false,
 * )]
 * class Author extends Model
 * {
 *     use HasSlug;
 * }
 * ```
 *
 * @category Attributes
 *
 * @since    2.0.0
 *
 * @see \Academorix\Database\Concerns\Model\HasSlug
 */
#[Attribute(Attribute::TARGET_CLASS)]
final readonly class Sluggable
{
    /**
     * @param  string  $source              Source field for slug generation.
     * @param  string  $column              Column that stores the slug.
     * @param  string  $separator           Word separator in the slug.
     * @param  bool    $unique              Whether to enforce slug uniqueness.
     * @param  bool    $regenerateOnUpdate  Whether to regenerate when the source changes.
     * @param  bool    $routeBinding        Whether to use the slug for route model binding.
     */
    public function __construct(
        public string $source = 'name',
        public string $column = 'slug',
        public string $separator = '-',
        public bool $unique = true,
        public bool $regenerateOnUpdate = true,
        public bool $routeBinding = true,
    ) {}
}
