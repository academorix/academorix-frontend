<?php

/**
 * @file UsesStubs.php
 * @module Stackra\Cli\Concerns
 * @description Delegates to {@see \Stackra\Cli\Stubs\StubRenderer}. The
 *   trait is intentionally thin — real logic lives in the service class.
 */

declare(strict_types=1);

namespace Stackra\Cli\Concerns;

use Stackra\Cli\Stubs\StubRenderer;

/**
 * Composed by every command through {@see \Stackra\Cli\Commands\AbstractCommand}.
 *
 * @property \Stackra\Cli\Container $container populated by {@see \Stackra\Cli\Commands\AbstractCommand}
 */
trait UsesStubs
{
    /**
     * Render the named stub to `outputPath`, substituting `tokens` and
     * running the file through its formatter (Pint / Prettier).
     *
     * @param  array<string, mixed>  $tokens
     */
    public function renderStub(string $logicalName, string $outputPath, array $tokens, bool $strict = false): void
    {
        $this->container->resolve(StubRenderer::class)
            ->render($logicalName, $outputPath, $tokens, $strict);
    }
}
