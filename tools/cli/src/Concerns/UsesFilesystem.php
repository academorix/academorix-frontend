<?php

/**
 * @file UsesFilesystem.php
 * @module Academorix\Cli\Concerns
 * @description Wraps `Illuminate\Filesystem\Filesystem` for the ops the CLI
 *   actually needs. Every method throws a
 *   {@see \Academorix\Cli\Exceptions\CliException} on failure so callers get
 *   consistent remediation guidance.
 */

declare(strict_types=1);

namespace Academorix\Cli\Concerns;

use Academorix\Cli\Exceptions\CliException;
use Illuminate\Filesystem\Filesystem;

/**
 * Composed by every command through {@see \Academorix\Cli\Commands\AbstractCommand}.
 *
 * @property \Academorix\Cli\Container $container populated by {@see \Academorix\Cli\Commands\AbstractCommand}
 */
trait UsesFilesystem
{
    public function readFile(string $path): string
    {
        $fs = $this->filesystem();
        if (! $fs->exists($path)) {
            throw CliException::forMissingFile($path);
        }

        return $fs->get($path);
    }

    public function writeFile(string $path, string $contents): void
    {
        $fs = $this->filesystem();
        $fs->ensureDirectoryExists(dirname($path));
        $fs->put($path, $contents);
    }

    public function ensureDir(string $path): void
    {
        $this->filesystem()->ensureDirectoryExists($path);
    }

    public function copyDir(string $src, string $dest): void
    {
        $fs = $this->filesystem();
        if (! $fs->isDirectory($src)) {
            throw CliException::forMissingDirectory($src);
        }
        $fs->ensureDirectoryExists($dest);
        $fs->copyDirectory($src, $dest);
    }

    public function deleteFile(string $path): void
    {
        $this->filesystem()->delete($path);
    }

    public function fileExists(string $path): bool
    {
        return $this->filesystem()->exists($path);
    }

    public function directoryExists(string $path): bool
    {
        return $this->filesystem()->isDirectory($path);
    }

    private function filesystem(): Filesystem
    {
        return $this->container->resolve(Filesystem::class);
    }
}
