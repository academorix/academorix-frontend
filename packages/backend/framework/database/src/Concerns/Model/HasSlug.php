<?php

declare(strict_types=1);

/**
 * HasSlug Trait.
 *
 * Auto-generates URL-friendly slugs from a configurable source field.
 * Handles uniqueness by appending numeric suffixes (-1, -2, etc.).
 * Slugs are generated on creation and optionally regenerated on update
 * when the source field changes.
 *
 * ## Required Column:
 * - slug (varchar, unique)
 *
 * ## Usage:
 * ```php
 * use Stackra\Database\Concerns\Model\HasSlug;
 *
 * class Post extends Model
 * {
 *     use HasSlug;
 *
 *     // Optional: override the source field (default: 'name')
 *     public function slugSource(): string { return 'title'; }
 * }
 *
 * $post = Post::create(['title' => 'Hello World']);
 * $post->slug; // → 'hello-world'
 *
 * // Duplicate titles get numeric suffixes:
 * $post2 = Post::create(['title' => 'Hello World']);
 * $post2->slug; // → 'hello-world-1'
 *
 * // Route model binding uses slug by default:
 * // Route::get('/posts/{post}', ...) → resolves by slug
 * ```
 *
 * @category Concerns
 *
 * @since    2.0.0
 *
 * @see \Illuminate\Support\Str::slug()
 * @see \Illuminate\Database\Eloquent\Model::getRouteKeyName()
 */

namespace Stackra\Database\Concerns\Model;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

/**
 * Auto-generates URL-friendly slugs with uniqueness handling.
 */
trait HasSlug
{
    /**
     * Boot the HasSlug trait.
     *
     * Registers Eloquent lifecycle hooks to auto-generate slugs on
     * creation and optionally regenerate on update when the source
     * field has changed and the slug was not manually overridden.
     *
     * @return void
     */
    public static function bootHasSlug(): void
    {
        // Read attribute configuration (if present)
        $config = null;
        $forClass = \Stackra\Database\Support\AttributeReader::forClass(static::class);
        foreach ($forClass->classAttributes as $attr) {
            if ($attr instanceof \Stackra\Database\Attributes\Sluggable) {
                $config = $attr;
                break;
            }
        }

        // Generate slug on creation if not already set
        static::creating(function (Model $model) use ($config): void {
            /** @var Model&HasSlug $model */
            $slugColumn = $config?->column ?? ($model->slugColumn ?? 'slug');
            $currentSlug = $model->getAttribute($slugColumn);

            // Only generate if the slug column is empty
            if (empty($currentSlug)) {
                $sourceField = $config?->source ?? $model->slugSource();
                $source = $model->getAttribute($sourceField);

                if ($source !== null && $source !== '') {
                    $separator = $config?->separator ?? $model->slugSeparator();
                    $slug = Str::slug((string) $source, $separator);

                    // Ensure uniqueness if configured
                    $unique = $config?->unique ?? $model->slugShouldBeUnique();
                    if ($unique) {
                        $slug = $model->makeSlugUnique($slug);
                    }

                    $model->setAttribute($slugColumn, $slug);
                }
            }
        });

        // Regenerate slug on update if the source field changed and slug wasn't manually set
        $regenerateOnUpdate = $config?->regenerateOnUpdate ?? true;

        if ($regenerateOnUpdate) {
            static::updating(function (Model $model) use ($config): void {
                /** @var Model&HasSlug $model */
                $slugColumn = $config?->column ?? ($model->slugColumn ?? 'slug');
                $sourceField = $config?->source ?? $model->slugSource();

                // Only regenerate if the source field was changed
                if (! $model->isDirty($sourceField)) {
                    return;
                }

                // Skip if the slug was explicitly changed (manual override)
                if ($model->isDirty($slugColumn)) {
                    return;
                }

                $source = $model->getAttribute($sourceField);

                if ($source !== null && $source !== '') {
                    $separator = $config?->separator ?? $model->slugSeparator();
                    $slug = Str::slug((string) $source, $separator);

                    $unique = $config?->unique ?? $model->slugShouldBeUnique();
                    if ($unique) {
                        $slug = $model->makeSlugUnique($slug, $model->getKey());
                    }

                    $model->setAttribute($slugColumn, $slug);
                }
            });
        }
    }

    // =========================================================================
    // Configuration (override in model)
    // =========================================================================

    /**
     * Get the source field used to generate the slug.
     *
     * @return string
     */
    public function slugSource(): string
    {
        return 'name';
    }

    /**
     * Get the separator used between slug words.
     *
     * @return string
     */
    public function slugSeparator(): string
    {
        return '-';
    }

    /**
     * Determine if the slug should be unique within the table.
     *
     * @return bool
     */
    public function slugShouldBeUnique(): bool
    {
        return true;
    }

    // =========================================================================
    // Slug Generation
    // =========================================================================

    /**
     * Generate a slug from the given string value.
     *
     * Uses Laravel's Str::slug() for Unicode-safe slug generation.
     *
     * @param  string  $value  The raw string to slugify.
     * @return string The generated slug.
     */
    protected function generateSlug(string $value): string
    {
        return Str::slug($value, $this->slugSeparator());
    }

    /**
     * Make the slug unique by appending a numeric suffix if needed.
     *
     * Queries the database for existing slugs matching the base slug
     * and appends -1, -2, etc. until a unique slug is found.
     *
     * @param  string  $slug  The base slug to make unique.
     * @param  int|string|null  $ignoreId  An ID to exclude from the uniqueness check (for updates).
     * @return string The unique slug.
     */
    protected function makeSlugUnique(string $slug, int|string|null $ignoreId = null): string
    {
        $slugColumn = $this->resolveSlugColumn();
        $separator = $this->resolveSlugSeparator();
        $originalSlug = $slug;
        $counter = 1;

        // Build a query to check for existing slugs
        $query = static::query()
            ->where($slugColumn, $slug);

        // Exclude the current model when updating
        if ($ignoreId !== null) {
            $query->where($this->getKeyName(), '!=', $ignoreId);
        }

        // Increment the suffix until a unique slug is found
        while ($query->exists()) {
            $slug = $originalSlug . $separator . $counter;
            $counter++;

            $query = static::query()
                ->where($slugColumn, $slug);

            if ($ignoreId !== null) {
                $query->where($this->getKeyName(), '!=', $ignoreId);
            }
        }

        return $slug;
    }

    // =========================================================================
    // Internal
    // =========================================================================

    /**
     * Resolve the slug column name from the attribute or default.
     *
     * @return string
     */
    protected function resolveSlugColumn(): string
    {
        $forClass = \Stackra\Database\Support\AttributeReader::forClass(static::class);
        foreach ($forClass->classAttributes as $attr) {
            if ($attr instanceof \Stackra\Database\Attributes\Sluggable) {
                return $attr->column;
            }
        }

        return $this->slugColumn ?? 'slug';
    }

    /**
     * Resolve the slug separator from the attribute or default.
     *
     * @return string
     */
    protected function resolveSlugSeparator(): string
    {
        $forClass = \Stackra\Database\Support\AttributeReader::forClass(static::class);
        foreach ($forClass->classAttributes as $attr) {
            if ($attr instanceof \Stackra\Database\Attributes\Sluggable) {
                return $attr->separator;
            }
        }

        return $this->slugSeparator();
    }

    // =========================================================================
    // Scope
    // =========================================================================

    /**
     * Scope to find a record by its slug.
     *
     * @param  \Illuminate\Database\Eloquent\Builder<static>  $query
     * @param  string  $slug  The slug to search for.
     * @return \Illuminate\Database\Eloquent\Builder<static>
     */
    public function scopeWhereSlug($query, string $slug)
    {
        $slugColumn = $this->resolveSlugColumn();

        return $query->where($slugColumn, $slug);
    }

    // =========================================================================
    // Route Model Binding
    // =========================================================================

    /**
     * Get the route key name for Laravel route model binding.
     *
     * Returns the slug column so that route parameters resolve by slug
     * instead of the default primary key. When the #[Sluggable] attribute
     * has routeBinding set to false, defers to the parent implementation.
     *
     * @return string
     */
    public function getRouteKeyName(): string
    {
        $forClass = \Stackra\Database\Support\AttributeReader::forClass(static::class);
        foreach ($forClass->classAttributes as $attr) {
            if ($attr instanceof \Stackra\Database\Attributes\Sluggable) {
                if (! $attr->routeBinding) {
                    return parent::getRouteKeyName();
                }

                return $attr->column;
            }
        }

        return $this->slugColumn ?? 'slug';
    }
}
