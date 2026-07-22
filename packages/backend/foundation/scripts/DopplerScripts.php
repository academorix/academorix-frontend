<?php

/**
 * @file packages/backend/foundation/scripts/DopplerScripts.php
 *
 * @description
 * Composer script handlers for Doppler integration.
 *
 * ## Composer entry points
 *
 *   "doppler:status" : "Stackra\\Foundation\\Scripts\\DopplerScripts::status"
 *   "doppler:setup"  : "Stackra\\Foundation\\Scripts\\DopplerScripts::setup"
 *
 * Replaces the classic `.env`-based EnvScripts. Since the workspace
 * is fully Doppler-driven per `.kiro/steering/doppler.md`, all env
 * management goes through the Doppler CLI. These wrappers only
 * exist to make the workflow discoverable via `composer` — the
 * underlying commands are `doppler configs` + `doppler setup`
 * exactly as documented.
 */

declare(strict_types=1);

namespace Stackra\Foundation\Scripts;

use Composer\Script\Event;

/**
 * Composer script handlers for Doppler CLI wrappers.
 *
 * @category Scripts
 *
 * @since    0.1.0
 */
final class DopplerScripts
{
    /**
     * Print the current Doppler setup for this app.
     *
     * Shows: project + config the local `.doppler.yaml` targets, the
     * effective secret count, and any `DOPPLER_TOKEN` / auth state.
     *
     * Usage: composer doppler:status
     */
    public static function status(Event $event): void
    {
        $io = $event->getIO();
        $io->write('<info>🔐 Doppler status:</info>');
        $io->write('');

        // `doppler configs` shows the resolved project + config for
        // the current working directory (reads `.doppler.yaml`).
        ScriptRunner::raw($event, 'doppler', ['configs'], allowFail: true);
        $io->write('');
        ScriptRunner::raw($event, 'doppler', ['secrets', '--only-names'], allowFail: true);
    }

    /**
     * Run the interactive Doppler setup for this app.
     *
     * Prompts for project + config selection and writes
     * `.doppler.yaml`. Idempotent — re-running updates the pinned
     * project/config.
     *
     * Usage: composer doppler:setup
     */
    public static function setup(Event $event): void
    {
        $event->getIO()->write('<info>🔐 Configuring Doppler for this app...</info>');
        ScriptRunner::raw($event, 'doppler', ['setup', '--no-interactive'], allowFail: true);
    }
}
