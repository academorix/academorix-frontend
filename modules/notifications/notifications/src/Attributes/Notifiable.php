<?php

declare(strict_types=1);

namespace Academorix\Notifications\Attributes;

use Attribute;

/**
 * Marks a class as notifiable — a model that can receive notifications.
 *
 * Discovered at boot by the framework's generic hydration pump so
 * downstream consumers can enumerate every notifiable model without
 * a manual registry entry.
 *
 * The attribute itself carries no configuration — receiving support
 * comes from composing the standard traits + implementing the wire
 * shape the dispatch gateway expects.
 *
 * ## Example
 *
 * ```php
 * #[Notifiable]
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
final readonly class Notifiable
{
    /**
     * Construct a discovery marker — no configuration to declare.
     */
    public function __construct()
    {
    }
}
