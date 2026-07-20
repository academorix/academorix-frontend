<?php

/**
 * @file UsesComposer.php
 * @module Academorix\Cli\Concerns
 * @description Wraps composer subcommands via
 *   {@see \Academorix\Cli\Support\ProcessRunner}. Every method takes a
 *   `cwd` so callers can install into a template destination or an
 *   existing package without changing global state.
 */

declare(strict_types=1);

namespace Academorix\Cli\Concerns;

use Academorix\Cli\Support\ProcessRunner;

/**
 * Composed by every command through {@see \Academorix\Cli\Commands\AbstractCommand}.
 *
 * @property \Academorix\Cli\Container $container populated by {@see \Academorix\Cli\Commands\AbstractCommand}
 */
trait UsesComposer
{
    public function composerInstall(string $cwd, bool $noDev = false): void
    {
        $command = ['composer', 'install', '--no-interaction', '--no-progress'];
        if ($noDev) {
            $command[] = '--no-dev';
        }
        $this->composerRunner()->run($command, $cwd);
    }

    public function composerRequire(string $cwd, string $package, ?string $version = null, bool $dev = false): void
    {
        $spec = $version === null ? $package : "{$package}:{$version}";
        $command = ['composer', 'require', '--no-interaction', '--no-progress'];
        if ($dev) {
            $command[] = '--dev';
        }
        $command[] = $spec;
        $this->composerRunner()->run($command, $cwd);
    }

    public function composerDumpAutoload(string $cwd, bool $optimize = true): void
    {
        $command = ['composer', 'dump-autoload'];
        if ($optimize) {
            $command[] = '--optimize';
        }
        $this->composerRunner()->run($command, $cwd);
    }

    private function composerRunner(): ProcessRunner
    {
        return $this->container->resolve(ProcessRunner::class);
    }
}
