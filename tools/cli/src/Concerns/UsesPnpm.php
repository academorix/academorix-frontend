<?php

/**
 * @file UsesPnpm.php
 * @module Stackra\Cli\Concerns
 * @description Wraps pnpm subcommands. `pnpm` is the workspace's canonical
 *   Node package manager — never npm, never yarn.
 */

declare(strict_types=1);

namespace Stackra\Cli\Concerns;

use Stackra\Cli\Support\ProcessRunner;

/**
 * Composed by every command through {@see \Stackra\Cli\Commands\AbstractCommand}.
 *
 * @property \Stackra\Cli\Container $container populated by {@see \Stackra\Cli\Commands\AbstractCommand}
 */
trait UsesPnpm
{
    public function pnpmInstall(string $cwd, bool $frozen = false): void
    {
        $command = ['pnpm', 'install'];
        if ($frozen) {
            $command[] = '--frozen-lockfile';
        }
        $this->pnpmRunner()->run($command, $cwd);
    }

    /**
     * @param  array<int, string>  $packages
     */
    public function pnpmAdd(string $cwd, array $packages, bool $dev = false): void
    {
        if ($packages === []) {
            return;
        }
        $command = ['pnpm', 'add'];
        if ($dev) {
            $command[] = '-D';
        }
        $command = array_merge($command, $packages);
        $this->pnpmRunner()->run($command, $cwd);
    }

    public function pnpmRun(string $cwd, string $script): void
    {
        $this->pnpmRunner()->run(['pnpm', 'run', $script], $cwd);
    }

    private function pnpmRunner(): ProcessRunner
    {
        return $this->container->resolve(ProcessRunner::class);
    }
}
