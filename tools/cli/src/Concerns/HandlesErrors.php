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
        // OmniTerm is initialised by `HasOmniTerm::initialize()` (which
        // Symfony Console dispatches before `execute()`). If a fatal
        // happens BEFORE that hook fires — command-construction errors,
        // input-validation errors thrown by Symfony itself — fall back
        // to plain output so the operator sees the actual root cause
        // instead of a secondary "property not initialised" fatal.
        $hasOmni = isset($this->omni);

        if ($e instanceof CliException) {
            if ($hasOmni) {
                $this->omni->statusError(
                    $e->headline(),
                    $e->getMessage(),
                    $e->remediation(),
                );
            } else {
                $output->writeln('<error>'.$e->headline().'</error>');
                $output->writeln($e->getMessage());
                foreach ($e->remediation() as $line) {
                    $output->writeln('  - '.$line);
                }
            }

            return $e->exitCode();
        }

        if ($hasOmni) {
            $this->omni->statusError(
                'Unexpected error',
                $e->getMessage() !== '' ? $e->getMessage() : $e::class,
                [
                    'This is a bug in the Academorix CLI, not in your project.',
                    'Re-run with -vvv to capture the full stack trace and file a report.',
                ],
            );
        } else {
            $output->writeln('<error>Unexpected error (pre-boot)</error>');
            $output->writeln($e::class.': '.($e->getMessage() !== '' ? $e->getMessage() : '(no message)'));
        }

        if ($output->isVerbose()) {
            $output->writeln('');
            $output->writeln('<fg=gray>'.$e->getTraceAsString().'</>');
        }

        return 1;
    }
}
