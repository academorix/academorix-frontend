<?php

declare(strict_types=1);

namespace Stackra\Activity\Attributes;

use Attribute;

/**
 * Marks a Model as opted into the activity feed.
 *
 * Discovered at boot by the framework's generic hydration pump
 * ({@see \Stackra\ServiceProvider\Bootstrappers\HydrationBootstrapper})
 * via the `#[HydratesFrom(LoggableActivity::class)]` declaration on
 * {@see \Stackra\Activity\Contracts\Services\ActivityRegistryInterface::register()}.
 * The `activity:describe` command reads the resulting registry to
 * print the compile-time inventory of every model publishing to the
 * feed.
 *
 * The attribute itself carries NO configuration — the composing
 * model's `HasActivityLog` trait owns the log-name + retention-tier
 * decisions. This attribute is purely a discovery marker.
 *
 * ## Example
 *
 * ```php
 * #[LoggableActivity]
 * final class Branch extends Model
 * {
 *     use HasActivityLog;
 * }
 * ```
 *
 * @category Activity
 *
 * @since    0.1.0
 */
#[Attribute(Attribute::TARGET_CLASS)]
final readonly class LoggableActivity
{
    /**
     * Construct a discovery marker. No arguments — every knob lives on
     * the composed `HasActivityLog` trait.
     */
    public function __construct()
    {
    }
}
