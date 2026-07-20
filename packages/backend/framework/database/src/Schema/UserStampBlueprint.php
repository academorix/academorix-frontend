<?php

declare(strict_types=1);

/**
 * UserStamp Blueprint Schema Macro.
 *
 * Registers the `userStampable()` Blueprint macro for adding polymorphic
 * user-stamp columns to migration tables. These columns track which user
 * created, updated, and deleted each record using polymorphic morphTo
 * relationships — supporting multiple authenticatable models (User, Admin, etc.).
 *
 * All stamp columns are nullable because system operations (queues, seeders,
 * console commands) may not have an authenticated user.
 *
 * ## Columns Added:
 * - `created_by_type` (string, nullable) — morph class of the creator
 * - `created_by_id` (unsignedBigInteger, nullable) — primary key of the creator
 * - `updated_by_type` (string, nullable) — morph class of the last updater
 * - `updated_by_id` (unsignedBigInteger, nullable) — primary key of the last updater
 * - `deleted_by_type` (string, nullable) — morph class of the deleter (for SoftDeletes)
 * - `deleted_by_id` (unsignedBigInteger, nullable) — primary key of the deleter
 *
 * ## Indexes:
 * - Composite index on [created_by_type, created_by_id]
 * - Composite index on [updated_by_type, updated_by_id]
 *
 * @example Basic migration usage:
 * ```php
 * Schema::create('posts', function (Blueprint $table) {
 *     $table->id();
 *     $table->string('title');
 *     $table->userStampable(); // Adds all 6 user-stamp columns + indexes
 *     $table->timestamps();
 *     $table->softDeletes();
 * });
 * ```
 *
 * @example Querying by creator:
 * ```php
 * // The HasUserStamp trait provides relationship methods:
 * $post->createdBy; // → User or Admin model instance
 * $post->wasCreatedBy($admin); // true/false
 * Post::createdBy($user)->get();
 * ```
 *
 * @category Schema
 *
 * @since    2.0.0
 *
 * @see \Academorix\Database\Concerns\Model\HasUserStamp
 * @see \Illuminate\Database\Eloquent\Relations\MorphTo
 * @see \Illuminate\Database\Schema\Blueprint
 */

namespace Academorix\Database\Schema;

use Illuminate\Database\Schema\Blueprint;
use Academorix\Database\Attributes\AsDatabaseBlueprint;

/**
 * Registers the userStampable() macro on Blueprint.
 *
 * Discovered automatically via #[AsDatabaseBlueprint] attribute.
 * Can also be registered manually: UserStampBlueprint::register()
 */
#[AsDatabaseBlueprint(
    description: 'Adds userStampable() macro for polymorphic user stamps',
    priority: 20,
)]
class UserStampBlueprint
{
    /**
     * Register the userStampable() macro on the Blueprint class.
     *
     * The macro adds six nullable polymorphic columns for tracking
     * which user created, updated, and deleted each record, plus
     * composite indexes on the creator and updater morph columns.
     *
     * @return void
     */
    public static function register(): void
    {
        Blueprint::macro('userStampable', function (): void {
            /** @var Blueprint $this */

            // Creator stamp — polymorphic morph class and ID
            $this->string('created_by_type')->nullable();
            $this->unsignedBigInteger('created_by_id')->nullable();

            // Updater stamp — polymorphic morph class and ID
            $this->string('updated_by_type')->nullable();
            $this->unsignedBigInteger('updated_by_id')->nullable();

            // Deleter stamp — polymorphic morph class and ID (for SoftDeletes)
            $this->string('deleted_by_type')->nullable();
            $this->unsignedBigInteger('deleted_by_id')->nullable();

            // Composite indexes for efficient polymorphic lookups
            $this->index(['created_by_type', 'created_by_id']);
            $this->index(['updated_by_type', 'updated_by_id']);
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
