<?php

/**
 * @file packages/architecture/src/Rules/RepositoryNeedsBindRule.php
 *
 * @description
 * Source rule: every concrete Repository class must carry
 * Laravel's container-level `#[Bind]` attribute so the container
 * knows which contract (interface) the class fulfils. Without
 * `#[Bind]`, `app(SomeRepositoryInterface::class)` returns null
 * or throws, and dependency injection for consumers silently
 * breaks.
 *
 * ## What it catches
 *
 * For files the resolver classifies as `Repository`, emit a
 * violation when the class declaration is missing the required
 * attribute.
 *
 * ## What it skips
 *
 *   - Interfaces (`interface FooRepository { ... }`) — the target
 *     of the bind, not the source.
 *   - Abstract classes (`abstract class BaseRepository`) — meant
 *     to be extended; only the concrete leaves need `#[Bind]`.
 *
 * ## Config
 *
 * `config('architecture.rules.repository_needs_bind')`:
 *
 *   - `severity`           — `error` by default.
 *   - `required_attribute` — FQCN of the binding attribute
 *                            (`Illuminate\Container\Attributes\Bind`).
 */

declare(strict_types=1);

namespace Stackra\Architecture\Rules;

use Stackra\Architecture\Enums\LayerType;
use Stackra\Architecture\Support\SourceFile;
use Stackra\Architecture\Violations\Severity;
use Stackra\Architecture\Violations\Violation;

/**
 * Require #[Bind] on concrete Repository classes.
 *
 * @final
 */
final class RepositoryNeedsBindRule extends AbstractRule
{
    /**
     * Stable dotted identifier. Do not change once shipped.
     */
    public function id(): string
    {
        return 'architecture.repository_needs_bind';
    }

    /**
     * One-line description surfaced by the reporter above the
     * violation group.
     */
    public function description(): string
    {
        return 'Concrete Repositories must carry #[Bind(...)] so the container knows what contract to bind them to.';
    }

    /**
     * Missing `#[Bind]` means the container can't resolve the
     * contract at runtime — silent failure. Fail CI.
     */
    protected function defaultSeverity(): Severity
    {
        return Severity::Error;
    }

    /**
     * Emit at most one violation per file: attribute present or
     * missing.
     *
     * @param  SourceFile     $file  Parsed source file.
     * @return list<Violation>       Empty when clean; one entry when missing.
     */
    public function check(SourceFile $file): array
    {
        // Only Repositories are subject to this rule.
        if ($this->layers->resolve($file) !== LayerType::Repository) {
            return [];
        }

        // Interfaces are the TARGET of the bind, not the source.
        // We don't attach `#[Bind]` to interfaces.
        if ($file->classKeyword !== 'class') {
            return [];
        }

        // Abstract repositories are extension points — the
        // concrete leaves carry the `#[Bind]`. Skip.
        if ($file->hasClassModifier('abstract')) {
            return [];
        }

        $requiredFqcn = $this->stringConfig('required_attribute');
        if ($requiredFqcn === '') {
            // Rule not configured — stay quiet.
            return [];
        }

        // Compare by short name — the parser stores attributes
        // as short names (last FQCN segment).
        $shortName = $this->shortName($requiredFqcn);

        if ($file->hasClassAttribute($shortName)) {
            return [];
        }

        return [
            $this->violation(
                file: $file,
                offender: $file->classFqcn ?? $file->path,
                message: \sprintf(
                    'Repository "%s" is missing the required attribute #[%s].',
                    $file->classFqcn ?? $file->path,
                    $shortName,
                ),
                line: null,
                hint: 'Add #[Bind(YourRepositoryInterface::class)] so the container knows what contract to bind this to.',
            ),
        ];
    }

    /**
     * Read a scalar string config value, tolerating a missing /
     * wrong-typed value by returning `''`.
     */
    private function stringConfig(string $key): string
    {
        $value = $this->config[$key] ?? null;

        return \is_string($value) ? $value : '';
    }

    /**
     * Reduce a fully-qualified class name to its last segment,
     * so we can compare against the attribute short names the
     * parser stores.
     */
    private function shortName(string $reference): string
    {
        $trimmed = \ltrim($reference, '\\');
        $lastSlash = \strrpos($trimmed, '\\');

        return $lastSlash === false ? $trimmed : \substr($trimmed, $lastSlash + 1);
    }
}
