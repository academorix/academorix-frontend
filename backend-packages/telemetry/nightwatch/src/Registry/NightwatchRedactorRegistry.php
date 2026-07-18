<?php

declare(strict_types=1);

/**
 * Nightwatch Redactor Registry.
 *
 * Manages discovered redactors grouped by event type. The compiler
 * registers these with the Nightwatch facade using the appropriate
 * `redact*` methods.
 *
 * @category Registry
 *
 * @since    1.0.0
 */

namespace Academorix\Nightwatch\Registry;

use Illuminate\Support\Collection;
use Academorix\Nightwatch\Contracts\NightwatchRedactor;
use Academorix\Nightwatch\Enums\NightwatchEventType;
use Illuminate\Container\Attributes\Singleton;

/**
 * Nightwatch Redactor Registry.
 *
 * Manages discovered redactors grouped by event type.
 * The service provider registers these with the Nightwatch facade
 * using the appropriate `redact*` methods.
 */
#[Singleton]
class NightwatchRedactorRegistry
{
    /**
     * @var array<string, Collection<int, NightwatchRedactor>>
     */
    protected array $redactors = [];

    /**
     * Register a redactor for a specific event type.
     */
    public function register(NightwatchEventType $eventType, NightwatchRedactor $redactor): void
    {
        $key = $eventType->value;

        if (! isset($this->redactors[$key])) {
            $this->redactors[$key] = collect();
        }

        $this->redactors[$key]->push($redactor);
    }

    /**
     * Get all redactors for a specific event type.
     *
     * @return Collection<int, NightwatchRedactor>
     */
    public function getRedactors(NightwatchEventType $eventType): Collection
    {
        return $this->redactors[$eventType->value] ?? collect();
    }

    /**
     * Get all registered redactors grouped by event type.
     *
     * @return array<string, Collection<int, NightwatchRedactor>>
     */
    public function all(): array
    {
        return $this->redactors;
    }
}
