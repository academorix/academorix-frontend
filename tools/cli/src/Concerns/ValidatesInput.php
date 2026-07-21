<?php

/**
 * @file ValidatesInput.php
 * @module Stackra\Cli\Concerns
 * @description Input validation helpers. Every assertion throws a
 *   {@see \Stackra\Cli\Exceptions\CliException} subclass with an
 *   appropriate remediation. Concrete commands call these early so
 *   downstream code can trust its inputs.
 */

declare(strict_types=1);

namespace Stackra\Cli\Concerns;

use Stackra\Cli\Exceptions\CliException;

/**
 * Composed by every command through {@see \Stackra\Cli\Commands\AbstractCommand}.
 */
trait ValidatesInput
{
    public function assertValidProjectName(string $name): void
    {
        if (! preg_match('/^[a-z][a-z0-9-]{1,29}$/', $name)) {
            throw CliException::forInvalidProjectName($name);
        }
    }

    public function assertValidModuleName(string $name): void
    {
        if (! preg_match('/^[a-z][a-z0-9-]*\/[a-z][a-z0-9-]*$/', $name)) {
            throw CliException::forInvalidModuleName($name);
        }
    }

    public function assertDirectoryDoesNotExist(string $path): void
    {
        if (is_dir($path) || is_file($path)) {
            throw CliException::forExistingProjectDir($path);
        }
    }

    public function assertDirectoryExists(string $path): void
    {
        if (! is_dir($path)) {
            throw CliException::forMissingDirectory($path);
        }
    }

    public function assertFileExists(string $path): void
    {
        if (! is_file($path)) {
            throw CliException::forMissingFile($path);
        }
    }
}
