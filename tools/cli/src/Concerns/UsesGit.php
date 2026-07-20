<?php

/**
 * @file UsesGit.php
 * @module Academorix\Cli\Concerns
 * @description Read-only git wrappers plus `git init` for new-project
 *   scaffolding. The CLI NEVER commits, pushes, stashes, or resets — those
 *   are supervisor-turn decisions.
 */

declare(strict_types=1);

namespace Academorix\Cli\Concerns;

use Academorix\Cli\Support\ProcessRunner;
use Symfony\Component\Process\Process;

/**
 * Composed by every command through {@see \Academorix\Cli\Commands\AbstractCommand}.
 *
 * @property \Academorix\Cli\Container $container populated by {@see \Academorix\Cli\Commands\AbstractCommand}
 */
trait UsesGit
{
    public function gitInit(string $cwd): void
    {
        $this->gitRunner()->run(['git', 'init', '--quiet'], $cwd);
    }

    public function gitCurrentBranch(string $cwd): ?string
    {
        $process = new Process(['git', 'rev-parse', '--abbrev-ref', 'HEAD'], $cwd);
        $process->run();
        if (! $process->isSuccessful()) {
            return null;
        }

        $branch = trim($process->getOutput());

        return $branch === '' ? null : $branch;
    }

    public function gitStatus(string $cwd): string
    {
        $process = new Process(['git', 'status', '--short'], $cwd);
        $process->run();

        return $process->getOutput();
    }

    /**
     * True when `$cwd` sits inside a git working tree.
     */
    public function isInsideGitTree(string $cwd): bool
    {
        $process = new Process(['git', 'rev-parse', '--is-inside-work-tree'], $cwd);
        $process->run();

        return $process->isSuccessful() && trim($process->getOutput()) === 'true';
    }

    private function gitRunner(): ProcessRunner
    {
        return $this->container->resolve(ProcessRunner::class);
    }
}
