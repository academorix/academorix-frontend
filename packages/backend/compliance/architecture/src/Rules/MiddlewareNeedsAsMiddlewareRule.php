<?php

/**
 * @file packages/architecture/src/Rules/MiddlewareNeedsAsMiddlewareRule.php
 *
 * @description
 * Source rule: every Middleware class must carry
 * `#[AsMiddleware]` so Stackra's Routing discovery layer
 * picks it up. Without the attribute, the middleware is defined
 * but never registered — requests bypass it silently, which is
 * catastrophic for auth / rate-limit / audit middleware.
 *
 * ## What it catches
 *
 * Middleware detection is namespace-based: any class whose FQCN
 * starts with one of the configured `middleware_namespaces`
 * prefixes is a middleware, and must carry the attribute. We
 * don't rely on the LayerResolver here because Middleware is
 * classified as `Infrastructure` by default, and Infrastructure
 * is a broad bucket that also includes providers, jobs,
 * observers, etc. — none of which need `#[AsMiddleware]`.
 *
 * ## What it skips
 *
 *   - Interfaces (they can't carry `#[AsMiddleware]` meaningfully).
 *   - Abstract classes (extension points — concrete leaves carry
 *     the attribute).
 *   - Files with no `classFqcn` (helper files, functions,
 *     bootstrap scripts).
 *
 * ## Config
 *
 * `config('architecture.rules.middleware_needs_as_middleware')`:
 *
 *   - `severity`              — `error` by default.
 *   - `required_attribute`    — FQCN of the routing attribute
 *                               (`Stackra\Routing\Attributes\AsMiddleware`).
 *   - `middleware_namespaces` — list of namespace prefixes
 *                               (with trailing backslash) whose
 *                               children are middleware.
 */

declare(strict_types=1);

namespace Stackra\Architecture\Rules;

use Stackra\Architecture\Support\SourceFile;
use Stackra\Architecture\Violations\Severity;
use Stackra\Architecture\Violations\Violation;

/**
 * Require #[AsMiddleware] on Middleware classes.
 *
 * @final
 */
final class MiddlewareNeedsAsMiddlewareRule extends AbstractRule
{
    /**
     * Stable dotted identifier.
     */
    public function id(): string
    {
        return 'architecture.middleware_needs_as_middleware';
    }

    /**
     * One-line description surfaced by the reporter.
     */
    public function description(): string
    {
        return 'Middleware classes must carry #[AsMiddleware] so Routing discovery registers them.';
    }

    /**
     * Missing the attribute means the middleware never runs — a
     * silent security / correctness failure. Fail CI.
     */
    protected function defaultSeverity(): Severity
    {
        return Severity::Error;
    }

    /**
     * Detect middleware by namespace and require the attribute.
     * Skip abstracts and interfaces.
     *
     * @param  SourceFile     $file  Parsed source file.
     * @return list<Violation>       Empty when clean; one entry when missing.
     */
    public function check(SourceFile $file): array
    {
        // Files without a class FQCN can't be classified — bail.
        if ($file->classFqcn === null) {
            return [];
        }

        // Namespace-driven detection. When no middleware
        // namespaces are configured, the rule is effectively
        // disabled.
        $middlewareNamespaces = $this->listOfStrings($this->config['middleware_namespaces'] ?? []);
        if ($middlewareNamespaces === []) {
            return [];
        }

        if (! $this->isUnderMiddlewareNamespace($file->classFqcn, $middlewareNamespaces)) {
            return [];
        }

        // Interfaces and traits can't act as middleware — they
        // don't dispatch requests.
        if ($file->classKeyword !== 'class') {
            return [];
        }

        // Abstract middleware bases don't need the attribute —
        // only the concrete children do.
        if ($file->hasClassModifier('abstract')) {
            return [];
        }

        $requiredFqcn = $this->stringConfig('required_attribute');
        if ($requiredFqcn === '') {
            // Rule not configured.
            return [];
        }

        $shortName = $this->shortName($requiredFqcn);

        if ($file->hasClassAttribute($shortName)) {
            return [];
        }

        return [
            $this->violation(
                file: $file,
                offender: $file->classFqcn,
                message: \sprintf(
                    'Middleware "%s" is missing the required attribute #[%s].',
                    $file->classFqcn,
                    $shortName,
                ),
                line: null,
                hint: 'Add #[AsMiddleware(alias: \'...\')] so the Routing discovery layer picks it up.',
            ),
        ];
    }

    /**
     * `true` when the class's FQCN starts with any of the
     * configured middleware namespace prefixes. Prefixes MUST
     * include the trailing backslash to avoid greedy matches
     * (`App\Http\Middleware\` vs `App\Http\MiddlewareUtilities\`).
     *
     * @param  list<string>  $prefixes
     */
    private function isUnderMiddlewareNamespace(string $classFqcn, array $prefixes): bool
    {
        foreach ($prefixes as $prefix) {
            if (\str_starts_with($classFqcn, $prefix)) {
                return true;
            }
        }

        return false;
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
     * Return the last segment of a FQCN so we can compare
     * against short-name attributes.
     */
    private function shortName(string $reference): string
    {
        $trimmed = \ltrim($reference, '\\');
        $lastSlash = \strrpos($trimmed, '\\');

        return $lastSlash === false ? $trimmed : \substr($trimmed, $lastSlash + 1);
    }
}
