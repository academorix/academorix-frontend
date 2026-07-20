<?php

/**
 * @file ProcessRunner.php
 * @module Academorix\Cli\Support
 * @description Thin wrapper around `Symfony\Component\Process\Process`.
 *   Streams stdout/stderr live to a callback when supplied; throws a
 *   `CliException::forSubprocessFailure(...)` on non-zero exit.
 */

declare(strict_types=1);

namespace Academorix\Cli\Support;

use Academorix\Cli\Exceptions\CliException;
use Symfony\Component\Process\Process;

/**
 * Thin process runner. Every CLI subprocess (composer, pnpm, git,
 * prettier, pint, python3) resolves through this class.
 */
final class ProcessRunner
{
    /**
     * Run a command and stream its output. Returns the exit code.
     *
     * @param  array<int, string>  $command
     * @param  callable(string, string): void|null  $onOutput
     *   Called with `(type, chunk)` per streamed chunk. `type` is
     *   `Process::OUT` or `Process::ERR`.
     */
    public function run(array $command, string $cwd, ?callable $onOutput = null, ?float $timeout = 300.0): int
    {
        $process = new Process($command, $cwd);
        $process->setTimeout($timeout);

        if ($onOutput !== null) {
            $process->run($onOutput);
        } else {
            $process->run();
        }

        $exit = $process->getExitCode() ?? 1;

        if ($exit !== 0) {
            throw CliException::forSubprocessFailure(
                implode(' ', $command),
                $exit,
                trim($process->getErrorOutput() ?: $process->getOutput()),
            );
        }

        return $exit;
    }

    /**
     * Run a command and return its stdout. Never streams; used for
     * `git rev-parse` and similar.
     *
     * @param  array<int, string>  $command
     */
    public function capture(array $command, string $cwd, ?float $timeout = 30.0): string
    {
        $process = new Process($command, $cwd);
        $process->setTimeout($timeout);
        $process->run();

        if (! $process->isSuccessful()) {
            throw CliException::forSubprocessFailure(
                implode(' ', $command),
                $process->getExitCode() ?? 1,
                trim($process->getErrorOutput() ?: $process->getOutput()),
            );
        }

        return trim($process->getOutput());
    }
}
