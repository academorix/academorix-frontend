<?php

/**
 * @file UsesFormatters.php
 * @module Academorix\Cli\Concerns
 * @description Post-emit format dispatch. Maps a file extension to the right
 *   formatter (Pint for PHP, Prettier for everything else). Silent no-op
 *   when the formatter isn't on PATH.
 */

declare(strict_types=1);

namespace Academorix\Cli\Concerns;

use Academorix\Cli\Support\ProcessRunner;
use Symfony\Component\Process\ExecutableFinder;

/**
 * Composed by every command through {@see \Academorix\Cli\Commands\AbstractCommand}.
 *
 * @property \Academorix\Cli\Container $container populated by {@see \Academorix\Cli\Commands\AbstractCommand}
 */
trait UsesFormatters
{
    /**
     * Format a single file in-place. Returns true when the formatter ran,
     * false when it was skipped (unknown extension or binary missing).
     */
    public function formatFile(string $path): bool
    {
        $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));

        return match ($ext) {
            'php' => $this->runFormatter(['pint', '--preset=laravel', $path], $path),
            'ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs' => $this->runFormatter(['prettier', '--write', $path], $path),
            'json', 'jsonc' => $this->runFormatter(['prettier', '--write', '--parser=json', $path], $path),
            'md', 'mdx' => $this->runFormatter(['prettier', '--write', '--parser=markdown', $path], $path),
            'yml', 'yaml' => $this->runFormatter(['prettier', '--write', '--parser=yaml', $path], $path),
            default => false,
        };
    }

    /**
     * @param  array<int, string>  $command
     */
    private function runFormatter(array $command, string $path): bool
    {
        $binary = $command[0];
        $finder = new ExecutableFinder;
        if ($finder->find($binary) === null) {
            return false;
        }

        $runner = $this->container->resolve(ProcessRunner::class);
        try {
            $runner->run($command, dirname($path));

            return true;
        } catch (\Throwable) {
            // Formatting is best-effort; failures never abort the CLI flow.
            return false;
        }
    }
}
