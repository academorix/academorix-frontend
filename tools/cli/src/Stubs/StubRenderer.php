<?php

/**
 * @file StubRenderer.php
 * @module Stackra\Cli\Stubs
 * @description Token-substitution renderer. Reads a stub, replaces every
 *   `{{ tokenName }}` marker, writes the emitted file, and dispatches
 *   the formatter. Strict mode throws on any unresolved marker; lenient
 *   mode leaves the marker in the emitted file as
 *   `{{ MISSING:tokenName }}` for the developer to see.
 */

declare(strict_types=1);

namespace Stackra\Cli\Stubs;

use Stackra\Cli\Exceptions\StubException;
use Illuminate\Filesystem\Filesystem;

/**
 * Token-substitution engine.
 */
final class StubRenderer
{
    public function __construct(
        private readonly Filesystem $filesystem,
        private readonly StubRegistry $registry,
        private readonly StubFormatter $formatter,
    ) {}

    /**
     * @param  array<string, mixed>  $tokens
     */
    public function render(string $logicalName, string $outputPath, array $tokens, bool $strict = false): void
    {
        $stubPath = $this->registry->pathFor($logicalName);
        $body = $this->filesystem->get($stubPath);

        // Substitute known tokens.
        $body = preg_replace_callback(
            '/\{\{\s*([A-Za-z_][A-Za-z0-9_]*)\s*\}\}/',
            static function (array $m) use ($tokens): string {
                $name = $m[1];

                return isset($tokens[$name]) ? (string) $tokens[$name] : $m[0];
            },
            $body,
        ) ?? $body;

        // Detect remaining markers.
        if (preg_match_all('/\{\{\s*([A-Za-z_][A-Za-z0-9_]*)\s*\}\}/', $body, $matches) > 0) {
            if ($strict) {
                throw StubException::forMissingToken($logicalName, $matches[1][0]);
            }
            $body = preg_replace(
                '/\{\{\s*([A-Za-z_][A-Za-z0-9_]*)\s*\}\}/',
                '{{ MISSING:$1 }}',
                $body,
            ) ?? $body;
        }

        $this->filesystem->ensureDirectoryExists(dirname($outputPath));
        $this->filesystem->put($outputPath, $body);

        $this->formatter->format($outputPath);
    }
}
