<?php

/**
 * @file packages/architecture/src/Rules/NoSingletonOnScopedDepsRule.php
 *
 * @description
 * Source rule: forbids classes carrying Laravel's
 * `#[Singleton]` container attribute from injecting request-
 * scoped services via container attributes like
 * `#[CurrentUser]`, `#[Authenticated]`, `#[RouteParameter]`, or
 * `#[Context]`.
 *
 * ## Why
 *
 * Under Octane, `#[Singleton]` classes are instantiated ONCE
 * per worker and reused across every request that worker
 * serves. Any request-scoped value captured at boot (the
 * current user, the current route, the current context) is
 * frozen — request N+1 will see request N's user, which is a
 * severe correctness / security bug.
 *
 * The correct annotation for classes that legitimately need
 * request-scoped state is `#[Scoped]`, which the container
 * re-instantiates per request.
 *
 * ## What it catches
 *
 * For files carrying `#[Singleton]`, scan the stripped content
 * for `#[<ScopedAttrShortName>]` for each configured
 * `scoped_attributes` FQCN. One violation per scoped attribute
 * found (deduped by attribute short name).
 *
 * This coarse "does the file mix Singleton with a scoped
 * attribute anywhere?" check is sufficient — Singleton classes
 * are small enough that any scoped attribute in the file is
 * almost certainly on a promoted constructor property.
 *
 * ## Config
 *
 * `config('architecture.rules.no_singleton_on_scoped_deps')`:
 *
 *   - `severity`           — `error` by default.
 *   - `scoped_attributes`  — list of FQCNs of request-scoped
 *                            container attributes.
 */

declare(strict_types=1);

namespace Academorix\Architecture\Rules;

use Academorix\Architecture\Support\SourceFile;
use Academorix\Architecture\Violations\Severity;
use Academorix\Architecture\Violations\Violation;

/**
 * Ban request-scoped injection on #[Singleton] classes.
 *
 * @final
 */
final class NoSingletonOnScopedDepsRule extends AbstractRule
{
    /**
     * Stable dotted identifier.
     */
    public function id(): string
    {
        return 'architecture.no_singleton_on_scoped_deps';
    }

    /**
     * One-line description surfaced by the reporter.
     */
    public function description(): string
    {
        return '#[Singleton] classes must not inject request-scoped dependencies — mark the class #[Scoped] instead.';
    }

    /**
     * Cross-request contamination bug. Fail CI hard.
     */
    protected function defaultSeverity(): Severity
    {
        return Severity::Error;
    }

    /**
     * Fire when `#[Singleton]` and any configured scoped
     * attribute both appear on the same class.
     *
     * @param  SourceFile     $file  Parsed source file.
     * @return list<Violation>       Zero or more violations, one per scoped attribute found.
     */
    public function check(SourceFile $file): array
    {
        // Trigger only on classes marked `#[Singleton]`.
        // hasClassAttribute() accepts short-name or FQCN.
        if (! $file->hasClassAttribute('Singleton')) {
            return [];
        }

        $scopedAttributes = $this->listOfStrings($this->config['scoped_attributes'] ?? []);
        if ($scopedAttributes === []) {
            return [];
        }

        $content = $file->strippedContent;
        $violations = [];
        // Dedupe by short name — one hit per scoped attribute
        // is enough to make the point.
        $seenShorts = [];

        foreach ($scopedAttributes as $fqcn) {
            $short = $this->shortName($fqcn);
            if (isset($seenShorts[$short])) {
                continue;
            }

            $pattern = '/#\[\s*' . \preg_quote($short, '/') . '\b/';
            if (\preg_match($pattern, $content, $match, \PREG_OFFSET_CAPTURE) !== 1) {
                continue;
            }

            /** @var array{0: string, 1: int} $capture */
            $capture = $match[0];
            $line = $this->lineForOffset($content, $capture[1]);

            $seenShorts[$short] = true;
            $violations[] = $this->violation(
                file: $file,
                offender: '#[' . $short . ']',
                message: \sprintf(
                    '#[Singleton] class "%s" injects request-scoped attribute #[%s] — request-scoped state leaks across requests.',
                    $file->classFqcn ?? $file->path,
                    $short,
                ),
                line: $line,
                hint: '#[Singleton] classes must be provably stateless. If you\'re injecting request-scoped services, mark the class #[Scoped] instead.',
            );
        }

        return $violations;
    }

    /**
     * Reduce a fully-qualified attribute name to its final
     * segment so we can match against the short-name form used
     * inside `#[...]` blocks.
     */
    private function shortName(string $reference): string
    {
        $trimmed = \ltrim($reference, '\\');
        $lastSlash = \strrpos($trimmed, '\\');

        return $lastSlash === false ? $trimmed : \substr($trimmed, $lastSlash + 1);
    }

    /**
     * Translate a byte offset within the file content into a
     * 1-indexed line number.
     */
    private function lineForOffset(string $content, int $offset): int
    {
        if ($offset <= 0) {
            return 1;
        }

        return \substr_count($content, "\n", 0, $offset) + 1;
    }
}
