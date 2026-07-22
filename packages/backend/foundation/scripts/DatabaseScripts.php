<?php

/**
 * @file packages/backend/foundation/scripts/DatabaseScripts.php
 *
 * @description
 * Composer script handlers for the Laravel database lifecycle.
 *
 * ## Composer entry points
 *
 *   "db:migrate"          : "Stackra\\Foundation\\Scripts\\DatabaseScripts::migrate"
 *   "db:migrate:fresh"    : "Stackra\\Foundation\\Scripts\\DatabaseScripts::fresh"
 *   "db:migrate:rollback" : "Stackra\\Foundation\\Scripts\\DatabaseScripts::rollback"
 *   "db:migrate:status"   : "Stackra\\Foundation\\Scripts\\DatabaseScripts::status"
 *   "db:seed"             : "Stackra\\Foundation\\Scripts\\DatabaseScripts::seed"
 *   "db:reset"            : "Stackra\\Foundation\\Scripts\\DatabaseScripts::reset"
 *   "db:wipe"             : "Stackra\\Foundation\\Scripts\\DatabaseScripts::wipe"
 *   "db:show"             : "Stackra\\Foundation\\Scripts\\DatabaseScripts::show"
 *
 * ## Why these live in Foundation, not in the database package
 *
 * The database package ships schema primitives + `BelongsToTenant` +
 * migration helpers. It has no runtime state of its own that
 * `composer db:*` would need. The wrappers below are pure
 * doppler-aware invocations of built-in artisan commands — they
 * belong with every other `composer` UX affordance in
 * {@see Stackra\Foundation\Scripts\ScriptRunner}.
 *
 * ## Doppler behaviour
 *
 * Every call routes through {@see ScriptRunner::artisan()} — it
 * auto-wraps with `doppler run --` when `DOPPLER_TOKEN` isn't set,
 * so `composer db:migrate` and `doppler run -- composer db:migrate`
 * behave identically.
 */

declare(strict_types=1);

namespace Stackra\Foundation\Scripts;

use Composer\Script\Event;

/**
 * Composer script handlers for the database lifecycle.
 *
 * @category Scripts
 *
 * @since    0.1.0
 */
final class DatabaseScripts
{
    /**
     * Run pending migrations.
     *
     * Usage: composer db:migrate
     */
    public static function migrate(Event $event): void
    {
        $event->getIO()->write('<info>📦 Running pending migrations...</info>');
        ScriptRunner::artisan($event, ['migrate', '--ansi']);
    }

    /**
     * Drop every table, re-run every migration, then seed.
     *
     * Destroys the database. Refuses in prod-like environments per
     * Laravel's built-in `--force` guard — set `APP_ENV=local` or
     * `APP_ENV=testing` before running.
     *
     * Usage: composer db:migrate:fresh
     */
    public static function fresh(Event $event): void
    {
        $event->getIO()->write('<info>📦 migrate:fresh + seed...</info>');
        ScriptRunner::artisan($event, ['migrate:fresh', '--seed', '--ansi']);
    }

    /**
     * Roll back the last batch of migrations.
     *
     * Extra args after `--` are forwarded (e.g.
     * `composer db:migrate:rollback -- --step=3`).
     *
     * Usage: composer db:migrate:rollback
     */
    public static function rollback(Event $event): void
    {
        $event->getIO()->write('<info>📦 Rolling back last migration batch...</info>');
        ScriptRunner::artisan(
            $event,
            array_merge(['migrate:rollback', '--ansi'], $event->getArguments()),
        );
    }

    /**
     * Show pending + ran migrations.
     *
     * Usage: composer db:migrate:status
     */
    public static function status(Event $event): void
    {
        ScriptRunner::artisan($event, ['migrate:status', '--ansi']);
    }

    /**
     * Run every registered seeder.
     *
     * Every seeder self-declares via `#[AsSeeder]` per ADR-0011;
     * discovery walks the workspace, filters by environment, sorts
     * by priority + FQCN, and fires each. The DatabaseSeeder
     * shell handles the walk.
     *
     * Usage: composer db:seed
     */
    public static function seed(Event $event): void
    {
        $event->getIO()->write('<info>🌱 Running seeders (discovered via #[AsSeeder])...</info>');
        ScriptRunner::artisan($event, ['db:seed', '--ansi']);
    }

    /**
     * Full reset — cache clear + migrate:fresh + seed.
     *
     * Convenience wrapper for local dev. Refuses in prod-like
     * environments (same guard as `db:migrate:fresh`).
     *
     * Usage: composer db:reset
     */
    public static function reset(Event $event): void
    {
        $io = $event->getIO();
        $io->write('<info>🔄 Full database reset...</info>');
        ScriptRunner::artisan($event, ['config:clear', '--ansi']);
        ScriptRunner::artisan($event, ['cache:clear', '--ansi'], allowFail: true);
        ScriptRunner::artisan($event, ['migrate:fresh', '--seed', '--ansi']);
        $io->write('<info>✔ Database reset complete.</info>');
    }

    /**
     * Drop every table.
     *
     * DESTRUCTIVE. Refuses in production without `--force`.
     *
     * Usage: composer db:wipe
     */
    public static function wipe(Event $event): void
    {
        $event->getIO()->write('<comment>⚠ Dropping every table...</comment>');
        ScriptRunner::artisan($event, ['db:wipe', '--ansi']);
    }

    /**
     * Inspect the database — connection + table row counts.
     *
     * Extra args after `--` are forwarded (e.g.
     * `composer db:show -- --views`).
     *
     * Usage: composer db:show
     */
    public static function show(Event $event): void
    {
        ScriptRunner::artisan(
            $event,
            array_merge(['db:show', '--ansi'], $event->getArguments()),
        );
    }
}
