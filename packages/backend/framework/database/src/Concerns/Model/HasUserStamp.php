<?php

declare(strict_types=1);

namespace Stackra\Database\Concerns\Model;

use Mattiverse\Userstamps\Traits\Userstamps;

/**
 * @file HasUserStamp.php
 *
 * @description
 * Stackra-side wrapper around {@see Userstamps} from
 * `mattiverse/userstamps`. Publishes ONE canonical userstamps trait
 * across every Stackra model so consumers depend on
 * `Stackra\Database\Concerns\Model\HasUserStamp` and never touch
 * the vendor namespace directly. The `mattiverse/userstamps`
 * dependency is declared once — in `stackra/database`'s
 * `composer.json` — and every module inherits it transitively.
 *
 * ## Behaviour (inherited from Mattiverse)
 *
 *  * Stamps `created_by` on `creating` and `updated_by` on `updating`
 *    with the currently authenticated user's ID (default guard).
 *  * When the composed model also uses `SoftDeletes`, stamps
 *    `deleted_by` on `deleting` and restores it to `null` on
 *    `restoring`.
 *  * All three stamp columns are nullable — system operations
 *    (queues, commands, factories) leave them `null` when no
 *    authenticated user is available.
 *
 * ## Required columns
 *
 *  * `created_by` — BIGINT UNSIGNED, nullable.
 *  * `updated_by` — BIGINT UNSIGNED, nullable.
 *  * `deleted_by` — BIGINT UNSIGNED, nullable. **Only present when
 *    the model composes `Illuminate\Database\Eloquent\SoftDeletes`.**
 *
 * Use the paired `UserStampBlueprint` macro from
 * {@see \Stackra\Database\Schema\UserStampBlueprint} to add
 * these columns in migrations.
 *
 * ## Usage
 *
 * ```php
 * use Stackra\Database\Concerns\Model\HasUserStamp;
 * use Illuminate\Database\Eloquent\SoftDeletes;
 *
 * final class Post extends Model
 * {
 *     use HasUserStamp;
 *     use SoftDeletes; // enables deleted_by stamping
 * }
 *
 * $post = Post::create(['title' => 'Hello']);
 * $post->creator; // → App\Models\User instance (or null)
 * $post->editor;  // → last updater
 * $post->destroyer; // → soft-deleter (nullable)
 * ```
 *
 * @category Concerns
 *
 * @since    3.0.0
 *
 * @see \Mattiverse\Userstamps\Traits\Userstamps
 * @see \Stackra\Database\Schema\UserStampBlueprint
 */
trait HasUserStamp
{
    use Userstamps;
}
