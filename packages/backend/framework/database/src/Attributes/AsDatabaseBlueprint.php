<?php

declare(strict_types=1);

/**
 * @file packages/database/src/Attributes/AsDatabaseBlueprint.php
 *
 * @description
 * Class-level marker attribute for schema blueprint macro
 * registrars. Every class carrying this attribute is picked up at
 * `composer dump-autoload` time by
 * {@see olvlvl/composer-attribute-collector} and its
 * `register()` static method is invoked once during the
 * {@see \Academorix\Database\Providers\DatabaseServiceProvider}
 * boot phase.
 *
 * ## Convention
 *
 * The target class MUST declare a `public static function register(): void`
 * — the discovery loop simply calls that method for every hit,
 * relying on the macro implementation to install itself on
 * {@see \Illuminate\Database\Schema\Blueprint}.
 *
 * ```php
 * #[AsDatabaseBlueprint(
 *     description: 'Adds archivable() macro',
 *     priority: 20,
 * )]
 * class ArchivableBlueprint
 * {
 *     public static function register(): void
 *     {
 *         Blueprint::macro('archivable', ...);
 *     }
 * }
 * ```
 *
 * ## Discovery ordering
 *
 * Registrars run in ascending `priority` order. When two
 * registrars declare the same macro name the higher priority
 * (lower number) wins because Blueprint's `macro()` overwrites
 * silently — the discovery loop does not warn on collisions.
 * Keep priorities in the 10 / 20 / 30 range and reserve 0-9 for
 * consumer-app overrides.
 *
 * @category Attributes
 *
 * @since    1.0.0
 */

namespace Academorix\Database\Attributes;

use Attribute;

/**
 * Marker attribute for schema Blueprint macro registrars.
 *
 * @see \Academorix\Database\Providers\DatabaseServiceProvider
 *   Consumer of this attribute — invokes `register()` on each
 *   discovered target during boot.
 */
#[Attribute(Attribute::TARGET_CLASS)]
final readonly class AsDatabaseBlueprint
{
    /**
     * @param  string       $description  Human-readable description used by developer tooling
     *                                    (`artisan academorix:blueprints`) — not required at runtime.
     * @param  int          $priority     Ordering hint for the boot-time registration loop.
     *                                    Lower runs first. Defaults to 100.
     */
    public function __construct(
        public string $description = '',
        public int $priority = 100,
    ) {
    }
}
