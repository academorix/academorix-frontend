<?php

/**
 * @file packages/architecture/src/Rules/CommandUsesAttributeSignatureRule.php
 *
 * @description
 * Source rule: every Artisan Console command must declare its
 * signature via the `#[Signature]` attribute, not via the
 * legacy `protected $signature` property.
 *
 * ## Why
 *
 * Attribute-based signatures make the command's contract
 * visible on the class declaration and integrate with the same
 * attribute-driven discovery Stackra uses everywhere else
 * (`#[AsController]`, `#[Bind]`, `#[AsMiddleware]`). The
 * property form still works at runtime but is invisible to
 * reflection-based tooling that relies on attribute discovery.
 *
 * ## What it catches
 *
 * Detection is base-class-based: any file whose `extends`
 * clause resolves (via the file's `use` statements) to one of
 * the configured `command_bases` FQCNs is a command. For those
 * files, two independent conditions fire:
 *
 *   1. The class does NOT carry the required `#[Signature]`
 *      attribute.
 *   2. The raw content contains `protected $signature`.
 *
 * Both produce their own violation (a class could carry BOTH
 * the attribute and the property; the property is still wrong).
 *
 * ## Config
 *
 * `config('architecture.rules.command_uses_attribute_signature')`:
 *
 *   - `severity`            — `warning` by default.
 *   - `required_attribute`  — FQCN of the signature attribute
 *                             (`Illuminate\Console\Attributes\Signature`).
 *   - `command_bases`       — list of FQCNs that mark a class
 *                             as a Console command.
 */

declare(strict_types=1);

namespace Stackra\Architecture\Rules;

use Stackra\Architecture\Support\SourceFile;
use Stackra\Architecture\Violations\Severity;
use Stackra\Architecture\Violations\Violation;

/**
 * Require #[Signature] on Console commands.
 *
 * @final
 */
final class CommandUsesAttributeSignatureRule extends AbstractRule
{
    /**
     * Regex matching the legacy `protected $signature` property
     * declaration. Visibility variants are accepted because the
     * intent is identical regardless.
     */
    private const string LEGACY_SIGNATURE_REGEX =
        '/\b(?:public|protected|private)\s+(?:static\s+)?\$signature\b/';

    /**
     * Stable dotted identifier.
     */
    public function id(): string
    {
        return 'architecture.command_uses_attribute_signature';
    }

    /**
     * One-line description surfaced by the reporter.
     */
    public function description(): string
    {
        return 'Console commands must declare their signature via #[Signature(...)], not via $signature.';
    }

    /**
     * Warning — hygiene / consistency rule. Both approaches
     * work at runtime; we push everyone toward the attribute
     * form without blocking CI.
     */
    protected function defaultSeverity(): Severity
    {
        return Severity::Warning;
    }

    /**
     * Detect command-base subclasses and enforce attribute-
     * based signature declarations.
     *
     * @param  SourceFile     $file  Parsed source file.
     * @return list<Violation>       Zero, one, or two violations.
     */
    public function check(SourceFile $file): array
    {
        // Only concrete classes can be commands.
        if ($file->classKeyword !== 'class') {
            return [];
        }

        if ($file->hasClassModifier('abstract')) {
            return [];
        }

        $commandBases = $this->listOfStrings($this->config['command_bases'] ?? []);
        if ($commandBases === []) {
            return [];
        }

        // Resolve the class's direct parent to a full FQCN and
        // check membership.
        $resolvedBase = $this->resolveExtends($file);
        if ($resolvedBase === '' || ! \in_array($resolvedBase, $commandBases, true)) {
            return [];
        }

        $requiredAttribute = $this->stringConfig('required_attribute');
        if ($requiredAttribute === '') {
            return [];
        }

        $shortName = $this->shortName($requiredAttribute);
        $violations = [];

        // Case 1 — attribute missing.
        if (! $file->hasClassAttribute($shortName)) {
            $violations[] = $this->violation(
                file: $file,
                offender: $file->classFqcn ?? $file->path,
                message: \sprintf(
                    'Command "%s" is missing the required attribute #[%s].',
                    $file->classFqcn ?? $file->path,
                    $shortName,
                ),
                line: null,
                hint: 'Replace `protected $signature = \'...\'` with #[Signature(\'...\')] on the class.',
            );
        }

        // Case 2 — legacy property present (independent of
        // Case 1: a class could have both).
        if (\preg_match(self::LEGACY_SIGNATURE_REGEX, $file->strippedContent) === 1) {
            $violations[] = $this->violation(
                file: $file,
                offender: '$signature',
                message: \sprintf(
                    'Command "%s" declares legacy `$signature` property — use #[%s] on the class instead.',
                    $file->classFqcn ?? $file->path,
                    $shortName,
                ),
                line: null,
                hint: 'Replace `protected $signature = \'...\'` with #[Signature(\'...\')] on the class.',
            );
        }

        return $violations;
    }

    /**
     * Expand the `extends` clause to a full FQCN using the
     * file's `use` statements. Idempotent for already-
     * qualified names.
     */
    private function resolveExtends(SourceFile $file): string
    {
        $extends = $file->extends;
        if ($extends === null) {
            return '';
        }

        // Already namespaced — strip leading backslash.
        if (\str_contains($extends, '\\')) {
            return \ltrim($extends, '\\');
        }

        // Short name — consult the file's use statements.
        $resolved = $file->resolveShortName($extends);

        return $resolved ?? $extends;
    }

    /**
     * Read a scalar string config value, tolerating missing /
     * wrong-typed values by returning `''`.
     */
    private function stringConfig(string $key): string
    {
        $value = $this->config[$key] ?? null;

        return \is_string($value) ? $value : '';
    }

    /**
     * Reduce a fully-qualified name to its last segment.
     */
    private function shortName(string $reference): string
    {
        $trimmed = \ltrim($reference, '\\');
        $lastSlash = \strrpos($trimmed, '\\');

        return $lastSlash === false ? $trimmed : \substr($trimmed, $lastSlash + 1);
    }
}
