<?php

declare(strict_types=1);

/**
 * Nightwatch Context Registry.
 *
 * Manages and executes all registered Nightwatch context providers.
 * Context providers are automatically discovered via Laravel's service
 * container tagging system and executed in priority order.
 *
 * @category Registry
 *
 * @since    1.0.0
 */

namespace Academorix\Nightwatch\Registry;

use Illuminate\Container\Attributes\Scoped;
use Illuminate\Container\Attributes\Tag;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Context;
use Academorix\Nightwatch\Contracts\NightwatchContext;
use Throwable;

/**
 * Nightwatch Context Registry.
 *
 * Manages and executes all registered Nightwatch context providers.
 * Context providers are automatically discovered via Laravel's service
 * container tagging system and executed in priority order.
 *
 * Each provider returns a key and data array. This registry wraps
 * the output with `Context::add($key, $data)`.
 *
 * ## Octane Safety:
 * Marked as #[Scoped] — recreated for every request.
 */
#[Scoped]
class NightwatchContextRegistry
{
    public const string CONTEXT_TAG = 'nightwatch.context.provider';

    /**
     * Manually registered context providers.
     *
     * @var Collection<int, NightwatchContext>
     */
    protected Collection $manualProviders;

    /**
     * @param iterable<NightwatchContext> $taggedProviders Tagged context providers
     */
    public function __construct(
        #[Tag(self::CONTEXT_TAG)]
        protected iterable $taggedProviders,
    ) {
        $this->manualProviders = collect();
    }

    /**
     * Register a context provider for the current request.
     */
    public function register(NightwatchContext $context): void
    {
        $this->manualProviders->push($context);
    }

    /**
     * Clear all manually registered providers.
     */
    public function clearManual(): void
    {
        $this->manualProviders = collect();
    }

    /**
     * Get all registered context providers sorted by priority (highest first).
     *
     * @return Collection<int, NightwatchContext>
     */
    public function getProviders(): Collection
    {
        return collect($this->taggedProviders)
            ->merge($this->manualProviders)
            ->sortByDesc(fn (NightwatchContext $ctx): int => $ctx->priority())
            ->values();
    }

    /**
     * Apply all context providers via `Context::add()`.
     *
     * Each provider returns key + data. This method wraps
     * the call so providers stay pure data objects.
     */
    public function applyAll(): void
    {
        foreach ($this->getProviders() as $provider) {
            try {
                $data = $provider->data();

                if ($data !== []) {
                    Context::add($provider->key(), $data);
                }
            } catch (Throwable $e) {
                logger()->warning('Nightwatch context provider failed', [
                    'provider' => $provider::class,
                    'error' => $e->getMessage(),
                ]);
            }
        }
    }
}
