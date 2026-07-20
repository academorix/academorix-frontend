<?php

/**
 * @file packages/database/src/Support/AttributeReader.php
 *
 * @description
 * Compatibility shim that mirrors the ergonomics of the old
 * `Pixielity\Discovery\Facades\Discovery::forClass()` runtime
 * attribute reader without the accompanying vendor dependency.
 *
 * ## Why this shim exists
 *
 * The Model concern traits (`HasSlug`, `HasTags`, `HasStatus`,
 * `HasSortOrder`, `HasUuid`, `HasUserStamp`, `HasArchive`) read
 * their per-model configuration from a class attribute at
 * `booted<Trait>` time — the same pattern used across the
 * `academorix/database` attribute surface (`#[Sluggable]`,
 * `#[Taggable]`, `#[StatusColumn]`, …).
 *
 * The old codebase used `academorix/discovery` /
 * `pixielity/laravel-discovery` for this so the read hit a cached
 * attribute map and cost O(1). The new monorepo has moved to
 * `olvlvl/composer-attribute-collector` which exposes attribute
 * targets keyed BY attribute (`findTargetClasses(X::class)`) — the
 * inverse direction of what the model-trait pattern wants
 * (attributes FOR a specific class).
 *
 * Rather than rewrite every `bootHas<Trait>()` method to use PHP
 * reflection directly (mechanical + verbose), this shim ports the
 * two-line ergonomics forward:
 *
 * ```php
 * $forClass = AttributeReader::forClass(static::class);
 * foreach ($forClass->classAttributes as $attr) {
 *     if ($attr instanceof MyAttribute) { … }
 * }
 * ```
 *
 * Internally it uses `ReflectionClass::getAttributes()` — no
 * caching, no filesystem, no discovery. PHP's runtime caches
 * reflection metadata per class-string, so the cost is O(1) after
 * the first lookup per class.
 *
 * ## Trade-off vs. olvlvl-native pattern
 *
 * `olvlvl/composer-attribute-collector` cannot answer "give me
 * every attribute on class X" — it stores targets one attribute at
 * a time. The compile-time index makes attribute-KEYED lookups
 * fast, but the class-KEYED lookup that model traits need is
 * fundamentally a reflection operation. That's OK: reflection is
 * cheap for a single class, and model traits only fire during
 * Eloquent's boot cycle (once per model class per worker).
 *
 * @since 1.0.0
 */

declare(strict_types=1);

namespace Academorix\Database\Support;

use ReflectionClass;

/**
 * Static helper that returns a lightweight view over the
 * class-level attributes of a target class.
 *
 * The returned object exposes a single public property
 * (`classAttributes`) matching the shape of the old Pixielity
 * `ClassContext` — every attribute is materialised into its
 * instance form so consumers can `instanceof`-check without
 * touching PHP reflection themselves.
 *
 * @see \Academorix\Database\Concerns\Model\HasSlug
 * @see \Academorix\Database\Concerns\Model\HasTags
 * @see \Academorix\Database\Concerns\Model\HasStatus
 * @see \Academorix\Database\Concerns\Model\HasSortOrder
 * @see \Academorix\Database\Concerns\Model\HasUuid
 * @see \Academorix\Database\Concerns\Model\HasUserStamp
 * @see \Academorix\Database\Concerns\Model\HasArchive
 */
final class AttributeReader
{
    /**
     * Per-class cache of the materialised attribute list. Keyed
     * by the target FQCN. Runtime-cached so consecutive lookups
     * for the same model class (e.g. `HasSlug::bootHasSlug()`
     * firing once per new model instance during a batch import)
     * avoid the second reflection walk.
     *
     * @var array<class-string, ClassAttributeView>
     */
    private static array $cache = [];

    /**
     * Read the class-level attributes of a target class in the
     * Pixielity `forClass()` shape.
     *
     * @param  class-string  $className  The target class FQCN.
     * @return ClassAttributeView Object with a populated `classAttributes` list.
     */
    public static function forClass(string $className): ClassAttributeView
    {
        if (isset(self::$cache[$className])) {
            return self::$cache[$className];
        }

        $instances = [];

        if (class_exists($className) || interface_exists($className) || trait_exists($className)) {
            $ref = new ReflectionClass($className);

            foreach ($ref->getAttributes() as $attribute) {
                try {
                    $instances[] = $attribute->newInstance();
                } catch (\Throwable) {
                    // Unknown / non-loadable attributes are ignored —
                    // matches Pixielity's own tolerance for third-party
                    // attributes that aren't in the current autoload map.
                    continue;
                }
            }
        }

        return self::$cache[$className] = new ClassAttributeView($instances);
    }
}
