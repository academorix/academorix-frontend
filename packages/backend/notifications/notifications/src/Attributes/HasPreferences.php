<?php

declare(strict_types=1);

namespace Stackra\Notifications\Attributes;

use Attribute;

/**
 * Marks a class as carrying per-user notification preferences.
 *
 * Discovered at boot by the framework's generic hydration pump so
 * the preference-management surface can enumerate every model whose
 * users have preference rows.
 *
 * The attribute carries no configuration — the composing model
 * relates to `NotificationPreference` through its `user_id` column.
 *
 * ## Example
 *
 * ```php
 * #[HasPreferences]
 * final class User extends Model
 * {
 *     // ...
 * }
 * ```
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[Attribute(Attribute::TARGET_CLASS)]
final readonly class HasPreferences
{
    /**
     * Construct a discovery marker — no configuration to declare.
     */
    public function __construct()
    {
    }
}
