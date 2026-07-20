<?php

/**
 * @file packages/architecture/src/Rules/EventsCarryAsEventAttributeRule.php
 *
 * @description
 * Source rule: every concrete class in an `**\/Events/**\/*.php`
 * path must carry `#[AsEvent]` from
 * `Academorix\Events\Attributes\AsEvent`.
 *
 * ## Why (ADR 0010)
 *
 * `#[AsEvent]` is the wire-contract marker — the event catalog
 * generator, cross-service audit logs, and static analysis rules
 * all key off it. Missing attributes silently create ghost events
 * that other systems don't know exist.
 *
 * ## What it catches
 *
 * A file whose path contains an `Events/` segment AND declares a
 * concrete class AND doesn't carry `#[AsEvent]`.
 *
 * ## Exceptions
 *
 *   - Abstract classes (base classes used by multiple events).
 *   - Files under `packages/framework/events/` (the framework
 *     itself).
 *
 * ## Paired migrator
 *
 * `dev-tools/migrations/src/EventsAsAttributeMigrator.php`
 * satisfies this rule automatically.
 */

declare(strict_types=1);

namespace Academorix\Architecture\Rules;

use Academorix\Architecture\Support\SourceFile;
use Academorix\Architecture\Violations\Severity;
use Academorix\Architecture\Violations\Violation;

/**
 * Enforce `#[AsEvent]` on every event class.
 *
 * @final
 */
final class EventsCarryAsEventAttributeRule extends AbstractRule
{
    public function id(): string
    {
        return 'architecture.events_carry_as_event_attribute';
    }

    public function description(): string
    {
        return 'Every class under `Events/` must carry `#[AsEvent]` from `academorix/events` — the event catalog + audit tooling key off it.';
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
        // Path-based scoping: only classes under `Events/`.
        if (! $this->isEventPath($file->path)) {
            return [];
        }

        if ($file->classKeyword !== 'class' || $file->className === null) {
            return [];
        }

        if ($file->hasClassModifier('abstract')) {
            return [];
        }

        $fqcn = $file->classFqcn ?? '';
        if (str_starts_with($fqcn, 'Academorix\\Events\\')) {
            return [];
        }

        if ($file->hasClassAttribute('AsEvent')) {
            return [];
        }

        return [
            $this->violation(
                file: $file,
                offender: $fqcn !== '' ? $fqcn : $file->className,
                message: \sprintf(
                    'Event "%s" is missing `#[AsEvent]`.',
                    $fqcn !== '' ? $fqcn : $file->className,
                ),
                line: null,
                hint: 'Run `php dev-tools/migrations/bin/academorix-migrate events --apply` to fix every violation of this rule automatically.',
            ),
        ];
    }

    private function isEventPath(string $path): bool
    {
        return \preg_match('#/Events/[^/]+\.php$#', $path) === 1
            || \preg_match('#/Events/[^/]+/[^/]+\.php$#', $path) === 1;
    }
}
