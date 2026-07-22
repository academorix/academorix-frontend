<?php

/**
 * @file packages/backend/foundation/scripts/ScriptRunner.php
 *
 * @description
 * Shared invocation helper for every composer-script class under
 * `packages/backend/foundation/scripts/`.
 *
 * ## Doppler awareness
 *
 * Every {@see artisan()} / {@see vendor()} / {@see raw()} call
 * detects whether we're already inside a `doppler run --` shell.
 * The detection reads the `DOPPLER_TOKEN` env var — Doppler sets
 * this when it injects into a child process. When present, the
 * command runs directly; when absent, the command is wrapped with
 * `doppler run --` so it always sees the doppler-injected env.
 *
 * That means every entrypoint works the same way regardless of
 * how the developer invoked it:
 *
 *   composer test              # ScriptRunner wraps with doppler
 *   doppler run -- composer test   # already wrapped; ScriptRunner passes through
 *
 * ## Exit semantics
 *
 * Non-zero exits bubble up. Set `allowFail: true` on the individual
 * call to swallow the failure (e.g. best-effort cache clears where
 * a missing namespace shouldn't halt the whole clear sweep).
 */

declare(strict_types=1);

namespace Stackra\Foundation\Scripts;

use Composer\Script\Event;

/**
 * Shared invocation utility for Composer script classes.
 *
 * All methods are `static`; the class is not instantiated. Used
 * only from `Stackra\Foundation\Scripts\*Scripts::*` handlers.
 *
 * @category Scripts
 *
 * @since    0.1.0
 */
final class ScriptRunner
{
    /**
     * Run `php artisan <args>` with automatic doppler wrapping.
     *
     * @param  Event         $event      Composer event context.
     * @param  list<string>  $args       Artisan sub-command + flags.
     * @param  bool          $allowFail  When true, non-zero exit is
     *                                   logged but does not exit
     *                                   the composer script. Default
     *                                   false (any failure aborts).
     */
    public static function artisan(Event $event, array $args, bool $allowFail = false): void
    {
        self::execute($event, 'php artisan', $args, $allowFail);
    }

    /**
     * Run `vendor/bin/<tool> <args>` with automatic doppler wrapping.
     *
     * @param  Event         $event      Composer event context.
     * @param  string        $tool       The binary name inside
     *                                   `vendor/bin/` (e.g. `pint`,
     *                                   `phpstan`, `pest`).
     * @param  list<string>  $args       Args passed to the tool.
     * @param  bool          $allowFail  See {@see artisan()}.
     */
    public static function vendor(Event $event, string $tool, array $args, bool $allowFail = false): void
    {
        self::execute($event, "vendor/bin/{$tool}", $args, $allowFail);
    }

    /**
     * Run an arbitrary command with automatic doppler wrapping.
     *
     * Escape hatch for tools that aren't `php artisan` or
     * `vendor/bin/*` — e.g. `doppler`, `npx`, `git`.
     *
     * @param  Event         $event      Composer event context.
     * @param  string        $command    Binary name (resolved from
     *                                   PATH by the shell).
     * @param  list<string>  $args       Args passed to the command.
     * @param  bool          $allowFail  See {@see artisan()}.
     */
    public static function raw(Event $event, string $command, array $args, bool $allowFail = false): void
    {
        self::execute($event, $command, $args, $allowFail);
    }

    /**
     * The actual `passthru` call — wraps with doppler when needed.
     *
     * @param  Event         $event      Composer event context.
     * @param  string        $binary     The base command
     *                                   (`php artisan`, `vendor/bin/pint`,
     *                                   `doppler`, ...).
     * @param  list<string>  $args       Positional args.
     * @param  bool          $allowFail  When true, exit code is
     *                                   ignored.
     */
    private static function execute(Event $event, string $binary, array $args, bool $allowFail): void
    {
        // If DOPPLER_TOKEN is set we're already inside `doppler run --`
        // — running the command directly reuses the injected env. If
        // it isn't set, wrap so the child inherits doppler's env.
        // Special case: the `doppler` command itself never gets
        // wrapped (would double-inject its own secrets).
        $needsDopplerWrap = $binary !== 'doppler'
            && getenv('DOPPLER_TOKEN') === false;

        $tokens = array_map('escapeshellarg', $args);
        $flatArgs = implode(' ', $tokens);
        $command = $needsDopplerWrap
            ? "doppler run -- {$binary} {$flatArgs}"
            : "{$binary} {$flatArgs}";

        $exitCode = 0;
        passthru($command, $exitCode);

        if ($exitCode !== 0 && ! $allowFail) {
            $event->getIO()->writeError("<error>✖ {$binary} failed (exit {$exitCode})</error>");
            exit($exitCode);
        }

        if ($exitCode !== 0 && $allowFail) {
            $event->getIO()->writeError(
                "<comment>⚠ {$binary} exited {$exitCode} (allowFail); continuing.</comment>",
            );
        }
    }
}
