<?php

declare(strict_types=1);

/**
 * Criteria Registry
 *
 * Central registry that holds and resolves registered components for the Framework module.
 * Populated at compile time and queried at runtime for fast lookups.
 *
 * @category Registry
 *
 * @since    1.0.0
 */
namespace Academorix\Crud\Registries;

use Illuminate\Container\Attributes\Singleton;
use Illuminate\Support\Arr;
use Academorix\Crud\Contracts\CriteriaInterface;
use RuntimeException;

/**
 * Criteria Registry.
 *
 * Central registry for all discovered Criteria classes. Populated
 * once at boot from the composer-attribute-collector manifest and
 * IMMUTABLE thereafter — same lookup table serves every request
 * on the worker.
 *
 * Bound as `#[Singleton]` per ADR 0006 (attribute-first DI). The
 * previous `#[Scoped]` marker was inconsistent with the
 * boot-populated-then-frozen data pattern — rebuilding the
 * registry per request wasted CPU on discovery that produces the
 * same result every time.
 *
 * @since 2.0.0
 */
#[Singleton]
final class CriteriaRegistry
{
    /** 
 * @var array<string, array{class: class-string, description: string|null, tags: array<string>, global: bool}> 
 */
    private array $criteria = [];

    public function register(string $name, string $class, ?string $description = null, array $tags = [], bool $global = false): void
    {
        if (isset($this->criteria[$name])) {
            throw new RuntimeException("Criteria '{$name}' is already registered.");
        }

        if (! class_exists($class)) {
            throw new RuntimeException("Criteria class '{$class}' does not exist.");
        }

        if (! is_subclass_of($class, CriteriaInterface::class)) {
            throw new RuntimeException("Criteria class '{$class}' must implement CriteriaInterface.");
        }

        $this->criteria[$name] = ['class' => $class, 'description' => $description, 'tags' => $tags, 'global' => $global];
    }

    public function get(string $name): string
    {
        if (! isset($this->criteria[$name])) {
            throw new RuntimeException("Criteria '{$name}' is not registered.");
        }

        return $this->criteria[$name]['class'];
    }

    public function has(string $name): bool
    {
        return isset($this->criteria[$name]);
    }

    public function all(): array
    {
        return $this->criteria;
    }

    public function findByTag(string $tag): array
    {
        return Arr::where($this->criteria, fn (array $c): bool => in_array($tag, $c['tags'], true));
    }

    public function names(): array
    {
        return array_keys($this->criteria);
    }

    public function tags(): array
    {
        $tags = [];

        foreach ($this->criteria as $criterion) {
            $tags = [...$tags, ...$criterion['tags']];
        }

        return array_unique($tags);
    }

    public function make(string $name, array $parameters = []): CriteriaInterface
    {
        $class = $this->get($name);

        return new $class(...$parameters);
    }

    /** 
 * Get all criteria marked as global. 
 */
    public function global(): array
    {
        return Arr::where($this->criteria, fn (array $c): bool => $c['global'] === true);
    }

    /** 
 * Get all non-global criteria. 
 */
    public function nonGlobal(): array
    {
        return Arr::where($this->criteria, fn (array $c): bool => $c['global'] === false);
    }

    public function clear(): void
    {
        $this->criteria = [];
    }

    public function count(): int
    {
        return count($this->criteria);
    }
}
