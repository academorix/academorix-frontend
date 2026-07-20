<?php

/**
 * @file HandlesErrors.php
 * @module Academorix\Cli\Concerns
 * @description Central exception rendering. Every command's `execute()`
 *   wraps the concrete `handle()` in `try { ... } catch (Throwable $e) {
 *   return $this->renderFatalError(...); }`. This trait unpacks a
 *   {@see \Academorix\Cli\Exceptions\CliException} into a formatted error
 *   card, and falls back to a generic "unexpected error" for any other
 *   `Throwable`.
 */

declare(strict_types=1);

namespace Academorix\Cli\Concerns;

use Academorix\Cli\Exceptions\CliException;
use Symfony\Component\Console\Output\OutputInterface;
use Throwable;

/**
 * Composed by every command through {@see \Academorix\Cli\Commands\AbstractCommand}.
 */
trait HandlesErrors
{
    public function renderFatalError(Throwable $e, OutputInterface $output): int
    {
        if ($e instanceof CliException) {
            $this->omni->statusError(
                $e->headline(),
                $e->getMessage(),
                $e->remediation(),
            );

            return $e->exitCode();
        }

        $this->omni->statusError(
            'Unexpected error',
            $e->getMessage() !== '' ? $e->getMessage() : $e::class,
            [
                'This is a bug in the Academorix CLI, not in your project.',
                'Re-run with -vvv to capture the full stack trace and file a report.',
            ],
        );

        if ($output->isVerbose()) {
            $output->writeln('');
            $output->writeln('<fg=gray>'.$e->getTraceAsString().'</>');
        }

        return 1;
    }
}
