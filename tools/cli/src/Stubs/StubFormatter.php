<?php

/**
 * @file StubFormatter.php
 * @module Academorix\Cli\Stubs
 * @description Post-render format dispatch. Delegates to the same
 *   `UsesFormatters`-style pipeline, but as a service so
 *   {@see StubRenderer} doesn't need the container plumbing that traits
 *   inherit from `AbstractCommand`.
 */

declare(strict_types=1);

namespace Academorix\Cli\Stubs;

use Academorix\Cli\Support\ProcessRunner;
use Symfony\Component\Process\ExecutableFinder;

/**
 * Formats a single file with the appropriate tool. Best-effort: missing
 * binaries silently skip.
 */
final class StubFormatter
{
    public function __construct(private readonly ProcessRunner $runner) {}

    public function format(string $path): bool
    {
        $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
        $command = match ($ext) {
            'php' => ['pint', '--preset=laravel', $path],
            'ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs' => ['prettier', '--write', $path],
            'json', 'jsonc' => ['prettier', '--write', '--parser=json', $path],
            'md', 'mdx' => ['prettier', '--write', '--parser=markdown', $path],
            'yml', 'yaml' => ['prettier', '--write', '--parser=yaml', $path],
            default => null,
        };

        if ($command === null) {
            return false;
        }

        $finder = new ExecutableFinder;
        if ($finder->find($command[0]) === null) {
            return false;
        }

        try {
            $this->runner->run($command, dirname($path));

            return true;
        } catch (\Throwable) {
            return false;
        }
    }
}
