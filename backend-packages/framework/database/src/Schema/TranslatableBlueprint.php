<?php

declare(strict_types=1);

/**
 * Translatable Blueprint Schema Macro.
 *
 * Registers the `translatable()` Blueprint macro for adding JSON
 * translatable columns to migration tables. The column stores
 * translations as a JSON object keyed by locale code.
 *
 * ## Column Added:
 * - `{$column}` (json) — stores translations as `{"en": "Hello", "fr": "Bonjour"}`
 *
 * @example Basic migration usage:
 * ```php
 * Schema::create('products', function (Blueprint $table) {
 *     $table->id();
 *     $table->translatable('name');         // JSON column for translatable name
 *     $table->translatable('description');  // JSON column for translatable description
 *     $table->decimal('price', 10, 2);
 *     $table->timestamps();
 * });
 * ```
 *
 * @example Stored JSON format:
 * ```json
 * {
 *     "en": "Wireless Headphones",
 *     "fr": "Écouteurs sans fil",
 *     "ar": "سماعات لاسلكية"
 * }
 * ```
 *
 * @example Accessing translations in the model:
 * ```php
 * // With a translatable accessor on the model:
 * $product->getTranslation('name', 'fr'); // → 'Écouteurs sans fil'
 * $product->setTranslation('name', 'de', 'Kabellose Kopfhörer');
 * ```
 *
 * @category Schema
 *
 * @since    2.0.0
 *
 * @see \Illuminate\Database\Schema\Blueprint
 * @see \Illuminate\Database\Schema\ColumnDefinition
 */

namespace Academorix\Database\Schema;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Schema\ColumnDefinition;
use Academorix\Database\Attributes\AsDatabaseBlueprint;

/**
 * Registers the translatable() macro on Blueprint.
 *
 * Discovered automatically via #[AsDatabaseBlueprint] attribute.
 * Can also be registered manually: TranslatableBlueprint::register()
 */
#[AsDatabaseBlueprint(
    description: 'Adds translatable() macro for JSON translatable columns',
    priority: 20,
)]
class TranslatableBlueprint
{
    /**
     * Register the translatable() macro on the Blueprint class.
     *
     * Creates a JSON column for storing locale-keyed translations.
     * JSON is used instead of a separate translations table for
     * simpler queries and fewer JOINs when translations are always
     * loaded with the parent model.
     *
     * @return void
     */
    public static function register(): void
    {
        Blueprint::macro('translatable', function (string $column): ColumnDefinition {
            /** @var Blueprint $this */

            // JSON column for locale-keyed translations (e.g., {"en": "Hello", "fr": "Bonjour"})
            return $this->json($column);
        });
    }

    /**
     * Invoke the macro registration (for auto-discovery via #[AsDatabaseBlueprint]).
     *
     * @return void
     */
    public function __invoke(): void
    {
        self::register();
    }
}
