<?php

/**
 * @file packages/architecture/src/Rules/ActionHasAsActionAttributeRule.php
 *
 * @description
 * Source rule: every concrete class under an `Actions/`
 * directory must carry `#[AsAction]` on the class body. Per
 * ADR 0016 (Actions-only architecture) that's how the router
 * discovers the action + wires it to a route.
 *
 * ## What it catches
 *
 *   - Concrete classes located under
 *     `Actions/…/*.php` that DO NOT carry the
 *     `#[AsAction]` attribute.
 *
 * The rule ONLY looks at the class-body attribute list — it
 * does NOT inspect route-verb attributes (`#[Get]`, `#[Post]`,
 * ...) because an action can be a background job / queue
 * consumer that doesn't need a route.
 *
 * ## Exceptions
 *
 *   - Abstract classes — action bases + traits.
 *   - Support / helper classes under `Actions/Support/` — often
 *     internal collaborators that aren't invocable endpoints.
 *
 * ## Paired migrator
 *
 * No dedicated migrator — adding `#[AsAction]` is a per-file
 * annotation decision that depends on whether the action is
 * exposed as an endpoint. Consumers add it by hand or via IDE
 * completion.
 */

declare(strict_types=1);

namespace Stackra\Architecture\Rules;

use Stackra\Architecture\Support\SourceFile;
use Stackra\Architecture\Violations\Severity;
use Stackra\Architecture\Violations\Violation;

/**
 * Enforce `#[AsAction]` on every class under `Actions/`.
 *
 * @final
 */
final class ActionHasAsActionAttributeRule extends AbstractRule
{
    public function id(): string
    {
        return 'architecture.action_has_as_action_attribute';
    }

    public function description(): string
    {
        return 'Every concrete class under `Actions/` must carry `#[AsAction]` — per ADR 0016 that\'s how the router discovers the action.';
    }

    protected function defaultSeverity(): Severity
    {
        return Severity::Error;
    }

    /**
     * @return list<Violation>
     */
    public function check(SourceFile $file): array
    {
        // Only concrete classes.
        if ($file->classKeyword !== 'class' || $file->className === null) {
            return [];
        }
        if ($file->hasClassModifier('abstract')) {
            return [];
        }

        // Only files whose path includes an `/Actions/` segment.
        if (! $this->isInActionsDirectory($file->path)) {
            return [];
        }

        // Skip helper classes under `Actions/Support/` or
        // `Actions/Concerns/` — they aren't the endpoint.
        if (
            str_contains($file->path, '/Actions/Support/')
            || str_contains($file->path, '/Actions/Concerns/')
        ) {
            return [];
        }

        if ($file->hasClassAttribute('AsAction')) {
            return [];
        }

        return [
            $this->violation(
                file: $file,
                offender: $file->classFqcn ?? $file->className,
                message: \sprintf(
                    'Action class "%s" is missing `#[AsAction]` — per ADR 0016 every action must carry the discovery marker.',
                    $file->classFqcn ?? $file->className,
                ),
                line: null,
                hint: 'Add `#[AsAction(name: \'kebab-case-route-name\')]` on the class body plus a route verb attribute (`#[Get]`, `#[Post]`, ...) when the action is exposed as an HTTP endpoint.',
            ),
        ];
    }

    private function isInActionsDirectory(string $absolutePath): bool
    {
        return str_contains($absolutePath, '/Actions/');
    }
}
