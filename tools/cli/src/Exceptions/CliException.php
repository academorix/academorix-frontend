<?php

/**
 * @file CliException.php
 * @module Academorix\Cli\Exceptions
 * @description Base exception for the CLI. Every subclass carries a
 *   headline (one-line error card title), a remediation list (bullet-
 *   list "how to fix" steps), and an exit code.
 *
 *   Exit-code convention:
 *   - 2 → user error (bad input, invalid name, existing dir)
 *   - 3 → environment error (missing workspace, permission denied)
 *   - 4 → subprocess failure (composer, pnpm, git, prettier, pint)
 */

declare(strict_types=1);

namespace Academorix\Cli\Exceptions;

use RuntimeException;

/**
 * Base exception. Extend for domain-specific errors; use named factories
 * so call sites read as fluent English.
 */
class CliException extends RuntimeException
{
    /**
     * @param  array<int, string>  $remediation
     */
    public function __construct(
        private readonly string $headline,
        string $message,
        private readonly array $remediation = [],
        private readonly int $exitCode = 2,
    ) {
        parent::__construct($message);
    }

    public function headline(): string
    {
        return $this->headline;
    }

    /**
     * @return array<int, string>
     */
    public function remediation(): array
    {
        return $this->remediation;
    }

    public function exitCode(): int
    {
        return $this->exitCode;
    }

    // ── User errors (exit code 2) ─────────────────────────────────────

    public static function forInvalidProjectName(string $name): self
    {
        return new self(
            'Invalid project name',
            sprintf('"%s" is not a valid Academorix project name.', $name),
            [
                'Project names must be kebab-case, 2-30 characters.',
                'Start with a lowercase letter; letters, digits, and hyphens only.',
                'Example: `my-academy`, `sports-club`, `demo-tenant`.',
            ],
            2,
        );
    }

    public static function forInvalidModuleName(string $name): self
    {
        return new self(
            'Invalid module name',
            sprintf('"%s" is not a valid module identifier.', $name),
            [
                'Module identifiers use `<tier>/<slug>` shape.',
                'Example: `foundation/audit`, `sports/athlete`.',
            ],
            2,
        );
    }

    public static function forExistingProjectDir(string $path): self
    {
        return new self(
            'Destination already exists',
            sprintf('%s already exists on disk.', $path),
            [
                'Pick a different project name, or',
                'Remove the existing directory first (verify it holds no work you want to keep).',
            ],
            2,
        );
    }

    // ── Environment errors (exit code 3) ──────────────────────────────

    public static function forMissingWorkspaceRoot(): self
    {
        return new self(
            'Not inside an Academorix workspace',
            'Could not find `pnpm-workspace.yaml` in the current directory or any parent.',
            [
                'Run this command from inside an Academorix workspace.',
                'Or bootstrap a new one with `academorix new <name>`.',
            ],
            3,
        );
    }

    public static function forMissingFile(string $path): self
    {
        return new self(
            'File not found',
            sprintf('%s does not exist.', $path),
            [
                'Verify the path and try again.',
            ],
            3,
        );
    }

    public static function forMissingDirectory(string $path): self
    {
        return new self(
            'Directory not found',
            sprintf('%s does not exist or is not a directory.', $path),
            [
                'Verify the path and try again.',
            ],
            3,
        );
    }

    public static function forInvalidJson(string $path, string $error): self
    {
        return new self(
            'Invalid JSON',
            sprintf('%s could not be parsed as JSON: %s', $path, $error),
            [
                'Check the file for a stray comma, missing quote, or trailing content.',
            ],
            3,
        );
    }

    public static function forInvalidYaml(string $path, string $error): self
    {
        return new self(
            'Invalid YAML',
            sprintf('%s could not be parsed as YAML: %s', $path, $error),
            [
                'Check the file for a bad indent, missing colon, or duplicate key.',
            ],
            3,
        );
    }

    public static function forPermissionDenied(string $path): self
    {
        return new self(
            'Permission denied',
            sprintf('The current user cannot read or write %s.', $path),
            [
                'Check file ownership and permissions.',
                'On macOS, the containing folder may need Full Disk Access.',
            ],
            3,
        );
    }

    public static function forMissingBinary(string $name): self
    {
        return new self(
            sprintf('Missing dependency: %s', $name),
            sprintf('`%s` was not found on PATH.', $name),
            [
                sprintf('Install `%s` and try again.', $name),
                'On macOS you can usually install it with Homebrew.',
            ],
            3,
        );
    }

    // ── Subprocess errors (exit code 4) ───────────────────────────────

    public static function forSubprocessFailure(string $command, int $exitCode, string $stderr): self
    {
        $lines = [
            sprintf('The subprocess exited with code %d.', $exitCode),
        ];
        if ($stderr !== '') {
            $lines[] = 'Its final output was:';
            $lines[] = $stderr;
        }

        return new self(
            'Subprocess failed',
            sprintf('Command `%s` did not succeed.', $command),
            $lines,
            4,
        );
    }
}
