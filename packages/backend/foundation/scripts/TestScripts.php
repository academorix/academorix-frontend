<?php

/**
 * @file packages/backend/foundation/scripts/TestScripts.php
 *
 * @description
 * Composer script handlers for running the Pest test suite.
 *
 * ## Composer entry points
 *
 *   "test"          : "Stackra\\Foundation\\Scripts\\TestScripts::run"
 *   "test:coverage" : "Stackra\\Foundation\\Scripts\\TestScripts::coverage"
 *   "test:parallel" : "Stackra\\Foundation\\Scripts\\TestScripts::parallel"
 *   "test:filter"   : "Stackra\\Foundation\\Scripts\\TestScripts::filter"
 *
 * ## Doppler awareness
 *
 * Every invocation goes through {@see ScriptRunner::artisan()} which
 * detects whether the caller is already inside a `doppler run --`
 * shell (via `DOPPLER_TOKEN` env). If not, the command is
 * automatically wrapped so `composer test` works whether you ran
 * it directly or via `doppler run -- composer test`.
 */

declare(strict_types=1);

namespace Stackra\Foundation\Scripts;

use Composer\Script\Event;

/**
 * Composer script handlers for the test suite.
 *
 * @category Scripts
 *
 * @since    0.1.0
 */
final class TestScripts
{
    /**
     * Run the full Pest test suite.
     *
     * Any extra arguments passed to composer after `--` are forwarded
     * to the underlying `artisan test` command.
     *
     * Usage:
     *   composer test
     *   composer test -- --stop-on-failure
     */
    public static function run(Event $event): void
    {
        $io = $event->getIO();
        $io->write('<info>🧪 Running Pest test suite...</info>');

        ScriptRunner::artisan($event, ['config:clear', '--ansi']);
        ScriptRunner::artisan(
            $event,
            array_merge(['test', '--ansi'], $event->getArguments()),
        );
    }

    /**
     * Run tests with Clover XML coverage.
     *
     * Requires Xdebug or PCOV. Coverage minimum defaults to 80% per
     * `.kiro/steering/testing.md`.
     *
     * Usage: composer test:coverage
     */
    public static function coverage(Event $event): void
    {
        $event->getIO()->write('<info>🧪 Running tests with coverage (min 80%)...</info>');

        ScriptRunner::artisan($event, ['config:clear', '--ansi']);
        ScriptRunner::artisan($event, [
            'test',
            '--ansi',
            '--coverage',
            '--min=80',
            '--coverage-clover=coverage.xml',
        ]);
    }

    /**
     * Run tests in parallel across N workers.
     *
     * Falls back to serial when Pest's parallel support isn't
     * available (missing brianium/paratest).
     *
     * Usage: composer test:parallel
     */
    public static function parallel(Event $event): void
    {
        $event->getIO()->write('<info>🧪 Running tests in parallel...</info>');

        ScriptRunner::artisan($event, ['config:clear', '--ansi']);
        ScriptRunner::artisan($event, ['test', '--ansi', '--parallel']);
    }

    /**
     * Run tests matching a filter pattern.
     *
     * Usage: composer test:filter -- UserTest
     */
    public static function filter(Event $event): void
    {
        $io = $event->getIO();
        $args = $event->getArguments();

        if ($args === []) {
            $io->writeError('<error>Usage: composer test:filter -- <pattern></error>');
            exit(1);
        }

        $pattern = $args[0];
        $io->write("<info>🧪 Running tests matching: {$pattern}</info>");

        ScriptRunner::artisan($event, ['config:clear', '--ansi']);
        ScriptRunner::artisan($event, ['test', '--ansi', "--filter={$pattern}"]);
    }
}
