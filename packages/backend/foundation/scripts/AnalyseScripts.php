<?php

/**
 * @file packages/backend/foundation/scripts/AnalyseScripts.php
 *
 * @description
 * Composer script handlers for PHPStan static analysis.
 *
 * ## Composer entry points
 *
 *   "analyse"          : "Stackra\\Foundation\\Scripts\\AnalyseScripts::run"
 *   "analyse:baseline" : "Stackra\\Foundation\\Scripts\\AnalyseScripts::baseline"
 *
 * PHPStan level max is expected per `.kiro/steering/architecture.md`
 * §Standard tools. The shared base config lives at
 * `config/phpstan-base.neon` at the workspace root; each package's
 * local `phpstan.neon` includes it.
 */

declare(strict_types=1);

namespace Stackra\Foundation\Scripts;

use Composer\Script\Event;

/**
 * Composer script handlers for PHPStan analysis.
 *
 * @category Scripts
 *
 * @since    0.1.0
 */
final class AnalyseScripts
{
    /**
     * Memory limit passed to PHPStan.
     *
     * 2G accommodates larger analysis surfaces (the API app pulls in
     * ~90 backend packages). Individual packages may pass less; the
     * override is applied via CLI flag.
     */
    private const string MEMORY_LIMIT = '2G';

    /**
     * Run PHPStan analysis.
     *
     * Exits non-zero on any error found. Level is read from the
     * caller's `phpstan.neon`.
     *
     * Usage: composer analyse
     */
    public static function run(Event $event): void
    {
        $event->getIO()->write('<info>🔍 Running PHPStan analysis...</info>');
        self::phpstan($event, ['analyse', '--no-progress']);
    }

    /**
     * Generate a PHPStan baseline file.
     *
     * Suppresses currently-existing errors so PHPStan can land in a
     * legacy codebase incrementally. Baseline lands at
     * `phpstan-baseline.neon`.
     *
     * Usage: composer analyse:baseline
     */
    public static function baseline(Event $event): void
    {
        $event->getIO()->write('<info>🔍 Generating PHPStan baseline...</info>');
        self::phpstan($event, ['analyse', '--no-progress', '--generate-baseline']);
        $event->getIO()->write('<info>✔ Baseline written to phpstan-baseline.neon</info>');
    }

    /**
     * Run `vendor/bin/phpstan` with the given args.
     *
     * @param  Event         $event Composer event context.
     * @param  list<string>  $args  PHPStan sub-command + flags.
     */
    private static function phpstan(Event $event, array $args): void
    {
        $memFlag = '--memory-limit=' . self::MEMORY_LIMIT;
        ScriptRunner::vendor($event, 'phpstan', array_merge($args, [$memFlag]));
    }
}
