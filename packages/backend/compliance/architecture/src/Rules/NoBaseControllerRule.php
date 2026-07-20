<?php

/**
 * @file packages/architecture/src/Rules/NoBaseControllerRule.php
 *
 * @description
 * Source rule: no class in a domain module may extend
 * `Illuminate\Routing\Controller`,
 * `Academorix\Routing\BaseController`,
 * `Academorix\Routing\Controller`, or
 * `Academorix\Crud\Controllers\CrudController`. Per ADR 0016
 * (Actions-only), controllers are banned in favour of
 * single-action classes.
 *
 * ## Why
 *
 * The dual model of ADR 0013 (Controllers OR Actions) drifted
 * over time — controllers became thin pass-throughs to Services
 * that themselves were pass-throughs to Repositories. ADR 0016
 * collapses the stack: one Action per endpoint, direct
 * repository access, no Controller / Service intermediates.
 *
 * ## What it catches
 *
 *   - `class X extends Controller { ... }`
 *   - `class X extends BaseController { ... }`
 *   - `class X extends CrudController { ... }`
 *   - `class X extends \Illuminate\Routing\Controller { ... }`
 *
 * The rule only fires when the offending file lives inside a
 * domain module (`apps/{app}/src/modules/…` or
 * `apps/{app}/src/…` that isn't `modules/`).
 *
 * ## Exceptions
 *
 *   - Framework packages (`packages/framework/…`) are exempt —
 *     they define the base classes.
 *   - The routing package's own `BaseController` and `Controller`
 *     stay so the deprecation path is graceful.
 *
 * ## Paired migrator
 *
 * `dev-tools/migrations/src/ControllerToActionMigrator.php`
 * (delegated to sub-agent) walks every Controller class, splits
 * each public method into its own Action class carrying the
 * appropriate route attribute, and deletes the Controller.
 */

declare(strict_types=1);

namespace Academorix\Architecture\Rules;

use Academorix\Architecture\Support\SourceFile;
use Academorix\Architecture\Violations\Severity;
use Academorix\Architecture\Violations\Violation;

/**
 * Enforce "no BaseController / CrudController / Illuminate
 * Controller in domain modules".
 *
 * @final
 */
final class NoBaseControllerRule extends AbstractRule
{
    /**
     * Banned parent class names (short-name; the rule normalises
     * `extends` clauses to short names for comparison).
     */
    private const array BANNED_BASES = [
        'Controller',
        'BaseController',
        'CrudController',
    ];

    public function id(): string
    {
        return 'architecture.no_base_controller';
    }

    public function description(): string
    {
        return 'Domain-module classes must NOT extend BaseController / CrudController / Illuminate Controller. Per ADR 0016 the Controller layer is banned; use single-action classes with `#[AsAction]` instead.';
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
        if ($file->classKeyword !== 'class' || $file->className === null || $file->extends === null) {
            return [];
        }

        // Only files under a domain module are in scope.
        if (! $this->isDomainModuleFile($file->path)) {
            return [];
        }

        $extends = ltrim($file->extends, '\\');
        $shortName = str_contains($extends, '\\')
            ? substr($extends, strrpos($extends, '\\') + 1)
            : $extends;

        if (! in_array($shortName, self::BANNED_BASES, true)) {
            return [];
        }

        return [
            $this->violation(
                file: $file,
                offender: $file->classFqcn ?? $file->className,
                message: \sprintf(
                    'Class "%s" extends "%s" — per ADR 0016, domain modules cannot ship Controllers. Split into `#[AsAction]` classes.',
                    $file->classFqcn ?? $file->className,
                    $file->extends,
                ),
                line: null,
                hint: 'Convert each public method of this controller into a separate Action class under `src/Actions/`, each carrying `#[AsAction]` + a route verb attribute (`#[Get]`, `#[Post]`, ...).',
            ),
        ];
    }

    /**
     * True when the source file lives under any
     * `apps/{app}/src/modules/{domain}/src/` tree — the domain-module
     * root.
     */
    private function isDomainModuleFile(string $absolutePath): bool
    {
        return (bool) preg_match(
            '#/apps/[^/]+/src/modules/[^/]+/src/#',
            $absolutePath,
        );
    }
}
