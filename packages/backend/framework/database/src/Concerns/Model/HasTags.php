<?php

declare(strict_types=1);

/**
 * HasTags Trait.
 *
 * Provides a polymorphic tagging system using a pivot table. Tags are
 * resolved by name, slug, or ID — string arguments are matched against
 * the tag name, integers against the tag ID.
 *
 * ## Required Tables:
 * - tags (id, name, slug, type, created_at, updated_at)
 * - taggables (tag_id, taggable_type, taggable_id)
 *
 * The tags table and its migration should be provided by a separate
 * tags module or created manually. This trait only manages the relationship.
 *
 * ## Usage:
 * ```php
 * use Stackra\Database\Concerns\Model\HasTags;
 *
 * class Post extends Model
 * {
 *     use HasTags;
 * }
 *
 * // Attach tags (by name, ID, or Tag model):
 * $post->attachTag('laravel');
 * $post->attachTag(5);
 * $post->syncTags(['laravel', 'php', 'eloquent']);
 *
 * // Check tags:
 * $post->hasTag('laravel');              // true
 * $post->hasAnyTag(['vue', 'laravel']);   // true
 * $post->hasAllTags(['laravel', 'php']); // true
 *
 * // Query by tags:
 * Post::withTag('laravel')->get();
 * Post::withAnyTags(['laravel', 'php'])->get();
 * Post::withAllTags(['laravel', 'php'])->get();
 * Post::withoutTags()->get();
 * ```
 *
 * @category Concerns
 *
 * @since    2.0.0
 *
 * @see \Illuminate\Database\Eloquent\Relations\MorphToMany
 */

namespace Stackra\Database\Concerns\Model;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphToMany;

/**
 * Polymorphic tagging system via a pivot table.
 */
trait HasTags
{
    // =========================================================================
    // Relationship
    // =========================================================================

    /**
     * Get all tags attached to this model.
     *
     * @return MorphToMany<Model, static>
     */
    public function tags(): MorphToMany
    {
        // Read attribute configuration (if present)
        $config = null;
        $forClass = \Stackra\Database\Support\AttributeReader::forClass(static::class);
        foreach ($forClass->classAttributes as $attr) {
            if ($attr instanceof \Stackra\Database\Attributes\Taggable) {
                $config = $attr;
                break;
            }
        }

        $tagModel = $config?->tagModel ?? $this->tagModelClass();
        $pivotTable = $config?->pivotTable ?? 'taggables';

        return $this->morphToMany(
            $tagModel,
            'taggable',
            $pivotTable,
        );
    }

    // =========================================================================
    // Operations
    // =========================================================================

    /**
     * Attach a tag to this model.
     *
     * Accepts a tag name (string), tag ID (int), or Tag model instance.
     * String values are resolved by name, creating the tag if it doesn't exist.
     *
     * @param  string|int|Model  $tag  The tag to attach.
     * @return static
     */
    public function attachTag(string|int|Model $tag): static
    {
        $tagId = $this->resolveTagId($tag);

        if ($tagId !== null) {
            // Use syncWithoutDetaching to avoid duplicate pivot entries
            $this->tags()->syncWithoutDetaching([$tagId]);
        }

        return $this;
    }

    /**
     * Detach a tag from this model.
     *
     * @param  string|int|Model  $tag  The tag to detach.
     * @return static
     */
    public function detachTag(string|int|Model $tag): static
    {
        $tagId = $this->resolveTagId($tag);

        if ($tagId !== null) {
            $this->tags()->detach($tagId);
        }

        return $this;
    }

    /**
     * Sync the model's tags to the given set.
     *
     * Detaches tags not in the array and attaches new ones.
     *
     * @param  array<string|int|Model>  $tags  The tags to sync.
     * @return static
     */
    public function syncTags(array $tags): static
    {
        $tagIds = array_filter(
            array_map(fn($tag) => $this->resolveTagId($tag), $tags),
        );

        $this->tags()->sync($tagIds);

        return $this;
    }

    /**
     * Detach all tags from this model.
     *
     * @return static
     */
    public function detachAllTags(): static
    {
        $this->tags()->detach();

        return $this;
    }

    // =========================================================================
    // Queries
    // =========================================================================

    /**
     * Determine if this model has the given tag.
     *
     * @param  string|int|Model  $tag  The tag to check.
     * @return bool
     */
    public function hasTag(string|int|Model $tag): bool
    {
        $tagId = $this->resolveTagId($tag);

        if ($tagId === null) {
            return false;
        }

        return $this->tags()->where('tags.id', $tagId)->exists();
    }

    /**
     * Determine if this model has any of the given tags.
     *
     * @param  array<string|int|Model>  $tags  The tags to check.
     * @return bool
     */
    public function hasAnyTag(array $tags): bool
    {
        $tagIds = array_filter(
            array_map(fn($tag) => $this->resolveTagId($tag), $tags),
        );

        if (empty($tagIds)) {
            return false;
        }

        return $this->tags()->whereIn('tags.id', $tagIds)->exists();
    }

    /**
     * Determine if this model has all of the given tags.
     *
     * @param  array<string|int|Model>  $tags  The tags to check.
     * @return bool
     */
    public function hasAllTags(array $tags): bool
    {
        $tagIds = array_filter(
            array_map(fn($tag) => $this->resolveTagId($tag), $tags),
        );

        if (empty($tagIds)) {
            return false;
        }

        // Count matching tags — must equal the number of requested tags
        return $this->tags()->whereIn('tags.id', $tagIds)->count() === count($tagIds);
    }

    // =========================================================================
    // Scopes
    // =========================================================================

    /**
     * Scope to models that have the given tag.
     *
     * @param  \Illuminate\Database\Eloquent\Builder<static>  $query
     * @param  string|int  $tag  Tag name or ID.
     * @return \Illuminate\Database\Eloquent\Builder<static>
     */
    public function scopeWithTag($query, string|int $tag)
    {
        return $query->whereHas('tags', function ($q) use ($tag): void {
            if (is_int($tag)) {
                $q->where('tags.id', $tag);
            } else {
                $q->where('tags.name', $tag);
            }
        });
    }

    /**
     * Scope to models that have any of the given tags.
     *
     * @param  \Illuminate\Database\Eloquent\Builder<static>  $query
     * @param  array<string|int>  $tags  Tag names or IDs.
     * @return \Illuminate\Database\Eloquent\Builder<static>
     */
    public function scopeWithAnyTags($query, array $tags)
    {
        return $query->whereHas('tags', function ($q) use ($tags): void {
            // Separate numeric IDs from string names
            $ids = array_filter($tags, 'is_int');
            $names = array_filter($tags, 'is_string');

            $q->where(function ($sub) use ($ids, $names): void {
                if (! empty($ids)) {
                    $sub->orWhereIn('tags.id', $ids);
                }
                if (! empty($names)) {
                    $sub->orWhereIn('tags.name', $names);
                }
            });
        });
    }

    /**
     * Scope to models that have all of the given tags.
     *
     * Uses a subquery per tag to ensure all tags are present.
     *
     * @param  \Illuminate\Database\Eloquent\Builder<static>  $query
     * @param  array<string|int>  $tags  Tag names or IDs.
     * @return \Illuminate\Database\Eloquent\Builder<static>
     */
    public function scopeWithAllTags($query, array $tags)
    {
        foreach ($tags as $tag) {
            $query->whereHas('tags', function ($q) use ($tag): void {
                if (is_int($tag)) {
                    $q->where('tags.id', $tag);
                } else {
                    $q->where('tags.name', $tag);
                }
            });
        }

        return $query;
    }

    /**
     * Scope to models that have no tags.
     *
     * @param  \Illuminate\Database\Eloquent\Builder<static>  $query
     * @return \Illuminate\Database\Eloquent\Builder<static>
     */
    public function scopeWithoutTags($query)
    {
        return $query->doesntHave('tags');
    }

    // =========================================================================
    // Internal
    // =========================================================================

    /**
     * Resolve a tag argument to its database ID.
     *
     * Strings are looked up by name (created if not found),
     * integers are used directly, and Model instances return their key.
     *
     * @param  string|int|Model  $tag  The tag to resolve.
     * @return int|null The tag ID, or null if unresolvable.
     */
    protected function resolveTagId(string|int|Model $tag): ?int
    {
        if ($tag instanceof Model) {
            return (int) $tag->getKey();
        }

        if (is_int($tag)) {
            return $tag;
        }

        // Look up by name, creating the tag if it doesn't exist
        $tagModel = $this->resolveTagModelClass();
        $resolved = $tagModel::query()->firstOrCreate(
            ['name' => $tag],
            ['slug' => \Illuminate\Support\Str::slug($tag)],
        );

        return (int) $resolved->getKey();
    }

    /**
     * Get the Tag model class name.
     *
     * Override this method if your Tag model lives in a different namespace.
     *
     * @return string The fully qualified Tag model class name.
     */
    protected function tagModelClass(): string
    {
        return \Stackra\Crud\Models\Tag::class;
    }

    /**
     * Resolve the Tag model class from the attribute or default.
     *
     * @return string The fully qualified Tag model class name.
     */
    protected function resolveTagModelClass(): string
    {
        $forClass = \Stackra\Database\Support\AttributeReader::forClass(static::class);
        foreach ($forClass->classAttributes as $attr) {
            if ($attr instanceof \Stackra\Database\Attributes\Taggable) {
                return $attr->tagModel;
            }
        }

        return $this->tagModelClass();
    }
}
