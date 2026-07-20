<?php

/**
 * @file TemplateHydrator.php
 * @module Academorix\Cli\Templates
 * @description Walks a source directory and copies every file to the
 *   destination. Text files run through token substitution; binary files
 *   copy unchanged. Binary detection: read first 512 bytes, count
 *   non-printable characters. > 30% non-printable = treat as binary.
 */

declare(strict_types=1);

namespace Academorix\Cli\Templates;

use Illuminate\Filesystem\Filesystem;
use Symfony\Component\Finder\Finder;

/**
 * Template hydration engine.
 */
final class TemplateHydrator
{
    private const BINARY_SAMPLE_BYTES = 512;

    private const BINARY_NONPRINTABLE_THRESHOLD = 0.30;

    public function __construct(private readonly Filesystem $filesystem) {}

    /**
     * Copy `sourceDir` to `destDir` in full, running text files through
     * token substitution.
     *
     * @param  array<string, mixed>  $tokens
     */
    public function hydrate(string $sourceDir, string $destDir, array $tokens): void
    {
        $this->filesystem->ensureDirectoryExists($destDir);

        $finder = new Finder;
        $finder->files()->in($sourceDir)->ignoreDotFiles(false);

        foreach ($finder as $file) {
            $relative = ltrim(str_replace($sourceDir, '', $file->getPathname()), '/');
            $target = $destDir.'/'.$relative;
            $this->filesystem->ensureDirectoryExists(dirname($target));

            $body = $file->getContents();

            if ($this->isTextContent($body)) {
                $body = $this->substitute($body, $tokens);
            }

            $this->filesystem->put($target, $body);
        }
    }

    /**
     * @param  array<string, mixed>  $tokens
     */
    private function substitute(string $body, array $tokens): string
    {
        return preg_replace_callback(
            '/\{\{\s*([A-Za-z_][A-Za-z0-9_]*)\s*\}\}/',
            static function (array $m) use ($tokens): string {
                $name = $m[1];

                return isset($tokens[$name]) ? (string) $tokens[$name] : $m[0];
            },
            $body,
        ) ?? $body;
    }

    /**
     * Heuristic binary detection. Reads the first N bytes and treats a
     * file as binary if more than 30% of those bytes are non-printable.
     */
    private function isTextContent(string $body): bool
    {
        if ($body === '') {
            return true;
        }

        $sample = substr($body, 0, self::BINARY_SAMPLE_BYTES);
        $len = strlen($sample);
        if ($len === 0) {
            return true;
        }

        $nonPrintable = 0;
        for ($i = 0; $i < $len; $i++) {
            $ord = ord($sample[$i]);
            if ($ord === 9 || $ord === 10 || $ord === 13) {
                continue; // tab, LF, CR
            }
            if ($ord < 32 || $ord === 127) {
                $nonPrintable++;
            }
        }

        return ($nonPrintable / $len) < self::BINARY_NONPRINTABLE_THRESHOLD;
    }
}
