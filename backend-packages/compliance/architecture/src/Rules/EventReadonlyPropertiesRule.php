<?php

/**
 * @file packages/architecture/src/Rules/EventReadonlyPropertiesRule.php
 *
 * @description
 * Source rule: every property on an Event class must be
 * `readonly`. Events are immutable data carriers — mutation
 * mid-flight defeats their purpose (you can't safely
 * broadcast, cache, or serialise a mutable event).
 *
 * ## Why
 *
 * The one-arrow rule for events: an event is the "what
 * happened" record for a moment in time. Once dispatched, it
 * cannot change — listeners across broadcast, queue, and
 * in-memory dispatchers all rely on that invariant. Marking
 * every constructor-promoted property (and every class-body
 * property) `readonly` enforces the invariant at the language
 * level rather than by convention.
 *
 * ## What it catches
 *
 * Detection is namespace-based: a file whose namespace
 * contains any of the configured
 * `event_indicators.namespace_contains` substrings is treated
 * as an Event. For those files, walk
 * {@see SourceFile::$properties} and emit one violation per
 * property that is not `isReadonly`.
 *
 * ## Config
 *
 * `config('architecture.rules.event_readonly_properties')`:
 *
 *   - `severity`          — `warning` by default.
 *   - `event_indicators`  — associative array with:
 *     - `namespace_contains` — list of namespace substrings that
 *                              mark a file as an Event.
 */

declare(strict_types=1);

namespace Academorix\Architecture\Rules;

use Academorix\Architecture\Support\SourceFile;
use Academorix\Architecture\Violations\Severity;
use Academorix\Architecture\Violations\Violation;

/**
 * Require `readonly` on every property of an Event class.
 *
 * @final
 */
final class EventReadonlyPropertiesRule extends AbstractRule
{
    /**
     * Stable dotted identifier.
     */
    public function id(): string
    {
        return 'architecture.event_readonly_properties';
    }

    /**
     * One-line description surfaced by the reporter.
     */
    public function description(): string
    {
        return 'Event properties must be readonly — events are immutable data carriers.';
    }

    /**
     * Warning — mutation-safety is a discipline; we surface it
     * to developers without blocking CI.
     */
    protected function defaultSeverity(): Severity
    {
        return Severity::Warning;
    }

    /**
     * Detect event-namespaced files and require readonly on
     * every property.
     *
     * @param  SourceFile     $file  Parsed source file.
     * @return list<Violation>       One per non-readonly property.
     */
    public function check(SourceFile $file): array
    {
        // No namespace — not an Event by any of our conventions.
        if ($file->namespace === null) {
            return [];
        }

        // Load the namespace-contains substrings. Missing /
        // empty means the rule is off.
        $eventIndicators = $this->config['event_indicators'] ?? [];
        $namespaceContains = [];
        if (\is_array($eventIndicators) && isset($eventIndicators['namespace_contains'])) {
            $namespaceContains = $this->listOfStrings($eventIndicators['namespace_contains']);
        }

        if ($namespaceContains === []) {
            return [];
        }

        // Cheap namespace-substring test — the config supplies
        // fragments like `\Events\`, so `str_contains` on the
        // namespace is the right primitive.
        $matched = false;
        foreach ($namespaceContains as $needle) {
            if (\str_contains($file->namespace, $needle)) {
                $matched = true;
                break;
            }
        }

        if (! $matched) {
            return [];
        }

        // Interfaces / traits / enums don't declare state in a
        // way we care about.
        if ($file->classKeyword !== 'class') {
            return [];
        }

        $violations = [];

        foreach ($file->properties as $property) {
            if ($property->isReadonly) {
                continue;
            }

            $violations[] = $this->violation(
                file: $file,
                offender: '$' . $property->name,
                message: \sprintf(
                    'Event "%s" declares mutable property $%s — event properties must be readonly.',
                    $file->classFqcn ?? $file->path,
                    $property->name,
                ),
                line: $property->line,
                hint: 'Event properties must be readonly — events are immutable data carriers. Add the `readonly` keyword to the constructor promoted property.',
            );
        }

        return $violations;
    }
}
