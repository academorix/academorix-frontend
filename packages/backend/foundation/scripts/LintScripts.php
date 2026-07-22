<?php

/**
 * @file packages/backend/foundation/scripts/LintScripts.php
 *
 * @description
 * Composer script handlers for Laravel Pint (code style).
 *
 * ## Composer entry points
 *
 *   "lint"     : "Stackra\\Foundation\\Scripts\\LintScripts::check"
 *   "lint:fix" : "Stackra\\Foundation\\Scripts\\LintScripts::fix"
 *
 * Pint is invoked via `vendor/bin/pint`; the shared base config
 * lives at `config/pint.json` at the workspace root when present.
 * Each package's local `pint.json` extends it.
 */

declare(strict_types=1);

namespace Stackra\Foundation\Scripts;

use Composer\Script\Event;

/**
 * Composer script handlers for Pint.
 *
 * @category Scripts
 *
 * @since    0.1.0
 */
final class LintScripts
{
    /**
     * Check code style without changes.
     *
     * CI-safe. Exits non-zero if any file would be reformatted.
     *
     * Usage: composer lint
     */
    public static function check(Event $event): void
    {
        $event->getIO()->write('<info>🎨 Checking code style with Pint...</info>');
        ScriptRunner::vendor($event, 'pint', ['--test']);
    }

    /**
     * Fix code style in place.
     *
     * Usage: composer lint:fix
     */
    public static function fix(Event $event): void
    {
        $event->getIO()->write('<info>🎨 Fixing code style with Pint...</info>');
        ScriptRunner::vendor($event, 'pint', []);
    }
}
