<?php

declare(strict_types=1);

/**
 * Nightwatch Filter Registry.
 *
 * Manages discovered filters grouped by event type. The compiler
 * registers these with the Nightwatch facade using the appropriate
 * `reject*` methods.
 *
 * @category Registry
 *
 * @since    1.0.0
 */

namespace Stackra\Nightwatch\Registry;

use Illuminate\Support\Collection;
use Stackra\Nightwatch\Contracts\NightwatchFilter;
use Stackra\Nightwatch\Enums\NightwatchEventType;
use Illuminate\Container\Attributes\Singleton;

/**
 * Nightwatch Filter Registry.
 *
 * Manages discovered filters grouped by event type.
 * The service provider registers these with the Nightwatch facade
 * using the appropriate `reject*` methods.
 */
#[Singleton]
class NightwatchFilterRegistry
{
    /**
     * @var array<string, Collection<int, NightwatchFilter>>
     */
    protected array $filters = [];

    /**
     * Register a filter for a specific event type.
     */
    public function register(NightwatchEventType $eventType, NightwatchFilter $filter): void
    {
        $key = $eventType->value;

        if (! isset($this->filters[$key])) {
            $this->filters[$key] = collect();
        }

        $this->filters[$key]->push($filter);
    }

    /**
     * Get all filters for a specific event type.
     *
     * @return Collection<int, NightwatchFilter>
     */
    public function getFilters(NightwatchEventType $eventType): Collection
    {
        return $this->filters[$eventType->value] ?? collect();
    }

    /**
     * Get all registered filters grouped by event type.
     *
     * @return array<string, Collection<int, NightwatchFilter>>
     */
    public function all(): array
    {
        return $this->filters;
    }
}
