<?php

/**
 * @file src/Services/ScopeRegistry.php
 *
 * @description
 * Concrete implementation of {@see ScopeRegistryInterface}. Holds
 * the consumer-namespace map in memory (singleton, per-app). The
 * regex validator is read from Laravel config at construct time so
 * a deployment can widen or tighten the naming rules without a
 * code change.
 */

declare(strict_types=1);

namespace Stackra\Scope\Registry;

use Stackra\Scope\Contracts\ScopeRegistryInterface;
use Stackra\Scope\Data\ScopeConsumerConfig;
use Stackra\Scope\Exceptions\ScopeConflictException;
use Stackra\Scope\Exceptions\ScopeValidationException;
use Illuminate\Contracts\Config\Repository as ConfigRepository;

/**
 * Consumer registry.
 *
 * ## Ordering
 *
 * Registrations happen at boot. Two providers might race — with
 * the deferred-provider mechanism (unlikely for scope consumers,
 * but possible), the order isn't guaranteed. That's fine: the
 * registry has no notion of order, only identity. The first
 * caller wins; a second caller with the same namespace throws.
 *
 * ## Config coupling
 *
 * The class only reads `scope.namespace_regex` once from config
 * at construction. Consumers who publish the scope config can
 * override the regex; the change takes effect on next boot.
 */
final class ScopeRegistry implements ScopeRegistryInterface
{
    /**
     * @var array<string, ScopeConsumerConfig>
     */
    private array $consumers = [];

    /**
     * Cached namespace validator regex.
     */
    private readonly string $namespaceRegex;

    /**
     * @param  ConfigRepository  $config  Injected — reading via a
     *                                    constructor param keeps
     *                                    the registry container-
     *                                    resolvable without the
     *                                    `config()` helper (Octane-
     *                                    safe).
     */
    public function __construct(ConfigRepository $config)
    {
        // Default matches the config file's default; when the file
        // is missing (e.g. in a test that hasn't published config),
        // we still honour the standard regex so the registry
        // behaviour is deterministic.
        $this->namespaceRegex = (string) $config->get(
            'scope.namespace_regex',
            '/^[a-z][a-z0-9_]{0,63}$/',
        );
    }

    public function consumer(string $namespace, ScopeConsumerConfig $config): void
    {
        if (\preg_match($this->namespaceRegex, $namespace) !== 1) {
            throw ScopeValidationException::invalidNamespace($namespace, $this->namespaceRegex);
        }

        if (isset($this->consumers[$namespace])) {
            throw ScopeConflictException::namespaceAlreadyRegistered($namespace);
        }

        $this->consumers[$namespace] = $config;
    }

    public function get(string $namespace): ?ScopeConsumerConfig
    {
        return $this->consumers[$namespace] ?? null;
    }

    public function has(string $namespace): bool
    {
        return isset($this->consumers[$namespace]);
    }

    public function all(): array
    {
        $keys = array_keys($this->consumers);
        sort($keys);

        return $keys;
    }
}
