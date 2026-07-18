<?php

/**
 * @file packages/architecture/src/Rules/ServiceProviderHasModuleAttributeRule.php
 *
 * @description
 * Source rule: every concrete `class Foo extends *ServiceProvider`
 * must carry `#[AsModule]` and `#[LoadsResources]` from
 * `academorix/service-provider`.
 *
 * ## Why
 *
 * The framework's discovery pass (`olvlvl/composer-attribute-collector`
 * + `AttributeDiscovery::forClass(Module::class)`) walks every
 * `#[AsModule]`-tagged class at boot to hydrate the module registry.
 * Without the attribute, a provider still boots via Laravel's own
 * discovery — but our cross-cutting registrations (permission /
 * role provider arrays, resource loaders, lifecycle hooks) never
 * fire.
 *
 * `#[LoadsResources]` mirrors the same shape: its presence tells
 * the base provider to walk the module's `config/`, `migrations/`,
 * `views/`, `lang/`, `routes/`, and `publishable/` directories
 * with the shipped defaults.
 *
 * ## What it catches
 *
 *   - A file that declares a `class <Name> extends *ServiceProvider`.
 *   - Missing `#[AsModule(...)]` attribute on the class.
 *   - Missing `#[LoadsResources(...)]` attribute on the class.
 *
 * Both are required. The rule fails when either is absent.
 *
 * ## Exceptions
 *
 *   - Abstract provider base classes are exempt — they aren't
 *     the discovery target, their concrete subclasses are.
 *   - The `Academorix\ServiceProvider` and `Academorix\Foundation`
 *     packages themselves are exempt (they define the machinery).
 *
 * ## Paired migrator
 *
 * `dev-tools/migrations/src/ServiceProviderMigrator.php` is
 * idempotent and mutates providers to satisfy this rule
 * automatically.
 */

declare(strict_types=1);

namespace Academorix\Architecture\Rules;

use Academorix\Architecture\Support\SourceFile;
use Academorix\Architecture\Violations\Severity;
use Academorix\Architecture\Violations\Violation;

/**
 * Enforce `#[AsModule]` + `#[LoadsResources]` on every concrete
 * ServiceProvider subclass.
 *
 * @final
 */
final class ServiceProviderHasModuleAttributeRule extends AbstractRule
{
    public function id(): string
    {
        return 'architecture.service_provider_has_module_attribute';
    }

    public function description(): string
    {
        return 'Every concrete ServiceProvider must carry `#[AsModule]` and `#[LoadsResources]` from `academorix/service-provider`.';
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
        // Skip anything that isn't a class declaration.
        if ($file->classKeyword !== 'class' || $file->className === null) {
            return [];
        }

        // Skip abstract providers — the concrete subclasses carry
        // the markers.
        if ($file->hasClassModifier('abstract')) {
            return [];
        }

        // Skip framework base packages that define the machinery.
        $fqcn = $file->classFqcn ?? '';
        if (
            str_starts_with($fqcn, 'Academorix\\ServiceProvider\\')
            || str_starts_with($fqcn, 'Academorix\\Foundation\\Providers\\')
        ) {
            return [];
        }

        // Only files whose class extends a `*ServiceProvider` are
        // in scope for this rule.
        if ($file->extends === null || ! str_ends_with($file->extends, 'ServiceProvider')) {
            return [];
        }

        $missing = [];
        if (! $file->hasClassAttribute('Module')) {
            $missing[] = '#[AsModule(name: ..., priority: ...)]';
        }
        if (! $file->hasClassAttribute('LoadsResources')) {
            $missing[] = '#[LoadsResources()]';
        }

        if ($missing === []) {
            return [];
        }

        return [
            $this->violation(
                file: $file,
                offender: $fqcn !== '' ? $fqcn : $file->className,
                message: \sprintf(
                    'ServiceProvider "%s" is missing: %s',
                    $fqcn !== '' ? $fqcn : $file->className,
                    \implode(' + ', $missing),
                ),
                line: null,
                hint: 'Run `php dev-tools/migrations/bin/academorix-migrate service-providers --apply` to fix every violation of this rule automatically.',
            ),
        ];
    }
}
