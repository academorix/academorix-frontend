<?php

declare(strict_types=1);

/**
 * Scope Registry
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
use Illuminate\Database\Eloquent\Scope;
use Illuminate\Support\Arr;
use RuntimeException;

/**
 * Scope Registry.
 *
 * Central registry for all discovered Scope classes. Populated
 * once at boot from the composer-attribute-collector manifest and
 * IMMUTABLE thereafter.
 *
 * Bound as `#[Singleton]` per ADR 0006 — boot-populated tables
 * don't benefit from per-request re-construction.
 *
 * @since 2.0.0
 */
#[Singleton]
final class ScopeRegistry
{
    /**
 * @var array<string, array{class: class-string, description: string|null, tags: array<string>}>
 */
    private array $scopes = [];

    public function register(string $name, string $class, ?string $description = null, array $tags = []): void
    {
        if (isset($this->scopes[$name])) {
            throw new RuntimeException("Scope '{$name}' is already registered.");
        }

        if (! class_exists($class)) {
            throw new RuntimeException("Scope class '{$class}' does not exist.");
        }

        if (! is_subclass_of($class, Scope::class)) {
            throw new RuntimeException("Scope class '{$class}' must implement Scope interface.");
        }

        $this->scopes[$name] = ['class' => $class, 'description' => $description, 'tags' => $tags];
    }

    public function get(string $name): string
    {
        if (! isset($this->scopes[$name])) {
            throw new RuntimeException("Scope '{$name}' is not registered.");
        }

        return $this->scopes[$name]['class'];
    }

    public function has(string $name): bool
    {
        return isset($this->scopes[$name]);
    }

    public function all(): array
    {
        return $this->scopes;
    }

    public function findByTag(string $tag): array
    {
        return Arr::where($this->scopes, fn (array $scope): bool => in_array($tag, $scope['tags'], true));
    }

    public function names(): array
    {
        return array_keys($this->scopes);
    }

    public function make(string $name, array $parameters = []): Scope
    {
        $class = $this->get($name);

        return new $class(...$parameters);
    }

    public function clear(): void
    {
        $this->scopes = [];
    }

    public function count(): int
    {
        return count($this->scopes);
    }
}
