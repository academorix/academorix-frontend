<?php

/**
 * @file packages/sdk/api-sdk/src/Registry/SdkResourceRegistry.php
 *
 * @description
 * Holds the sorted, name-keyed chain of every discovered
 * {@see \Academorix\ApiSdk\Contracts\SdkResource}. Populated
 * once at boot by the discovery pass in `ApiSdkServiceProvider`
 * and consumed by {@see \Academorix\ApiSdk\Client\ApiClient} on
 * every `$api->{$name}()` call.
 *
 * ## Octane safety
 *
 * The registry is a `#[Singleton]` — one shared instance across
 * every worker request. Concrete resources are stateless (their
 * only state is the `ApiConnector` reference, wired once during
 * discovery and immutable thereafter) so sharing them across
 * requests is safe.
 */

declare(strict_types=1);

namespace Academorix\ApiSdk\Registry;

use Academorix\ApiSdk\Contracts\SdkResource;
use Academorix\ApiSdk\Exceptions\ResourceNotFoundException;

/**
 * Name-keyed registry of discovered SDK resources.
 */
final class SdkResourceRegistry
{
    /**
     * Discovered resources keyed by `#[AsSdkResource]::$name`.
     * A LinkedHashMap-like insertion-order map (PHP arrays
     * preserve insertion order) — the discovery pass sorts by
     * priority before adding, so iteration yields resources in
     * priority order.
     *
     * @var array<string, SdkResource>
     */
    private array $resources = [];

    /**
     * Priority table snapshot; useful for diagnostic tooling
     * that wants to render the ordering without also holding
     * every attribute instance.
     *
     * @var array<string, int>
     */
    private array $priorities = [];

    /**
     * Register a resource. When two resources register under
     * the same `$name`, the later one wins — this lets an app
     * override a bundled resource with a bespoke variant by
     * shipping a duplicate name with a higher priority.
     */
    public function register(string $name, SdkResource $resource, int $priority = 100): void
    {
        $this->resources[$name]  = $resource;
        $this->priorities[$name] = $priority;
    }

    /**
     * Fetch a resource by name.
     *
     * @throws ResourceNotFoundException When no resource is registered under `$name`.
     */
    public function get(string $name): SdkResource
    {
        return $this->resources[$name]
            ?? throw new ResourceNotFoundException(
                "No SDK resource registered under name [{$name}]. "
                . 'Ensure the resource class carries `#[AsSdkResource(name: "'.$name.'")]` '
                . 'and that its owning composer package is loaded. '
                . 'Available resources: ' . implode(', ', array_keys($this->resources) ?: ['<none>']),
            );
    }

    /**
     * True when a resource is registered under `$name`.
     */
    public function has(string $name): bool
    {
        return isset($this->resources[$name]);
    }

    /**
     * Every registered resource, in insertion (priority) order.
     *
     * @return array<string, SdkResource>
     */
    public function all(): array
    {
        return $this->resources;
    }

    /**
     * The set of registered resource names — useful for
     * diagnostic commands.
     *
     * @return list<string>
     */
    public function names(): array
    {
        return array_keys($this->resources);
    }

    /**
     * Sort registered resources by their captured priority.
     * Called once by the discovery pass after every resource has
     * been added — keeps runtime cost of `register()` linear.
     */
    public function sortByPriority(): void
    {
        $priorities = $this->priorities;
        uksort(
            $this->resources,
            static function (string $a, string $b) use ($priorities): int {
                $priorityA = $priorities[$a] ?? 100;
                $priorityB = $priorities[$b] ?? 100;

                return $priorityA === $priorityB
                    ? strcmp($a, $b)
                    : $priorityA <=> $priorityB;
            },
        );
    }

    /**
     * Registry size — mostly for diagnostic output.
     */
    public function count(): int
    {
        return count($this->resources);
    }
}
