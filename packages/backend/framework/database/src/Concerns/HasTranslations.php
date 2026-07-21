<?php

declare(strict_types=1);

namespace Stackra\Database\Concerns;

use Spatie\Translatable\HasTranslations as SpatieHasTranslations;

/**
 * Adds per-locale translations to a model's text attributes
 * (spatie/laravel-translatable v6) — the Stackra standard for user-facing
 * text that varies by locale (en/ar).
 *
 * Wraps the vendor trait so the codebase references one Foundation concern,
 * mirroring {@see HasMetadata} and {@see InteractsWithMedia}. Each translatable
 * attribute is stored as a JSON object (`{"en": "...", "ar": "..."}`) — reads
 * resolve to the active locale (with fallback), and `setTranslation()` /
 * `getTranslation()` target a specific locale.
 *
 * A consuming model MUST declare which attributes are translatable (a trait
 * cannot), and their columns must be JSON — use the `translatable()` Blueprint
 * macro (Foundation) in the migration:
 *
 * ```php
 * // migration
 * $table->translatable('name', 'description');
 *
 * // model
 * use Stackra\Database\Concerns\HasTranslations;
 *
 * final class Discipline extends Model
 * {
 *     use HasTranslations;
 *
 *     /** @var list<string> *\/
 *     public array $translatable = ['name', 'description'];
 * }
 * ```
 *
 * Translate only display text (names, labels, bodies) — never identifiers
 * (slug, keys), proper nouns or enum values.
 */
trait HasTranslations // @phpstan-ignore trait.unused
{
    use SpatieHasTranslations;
}
