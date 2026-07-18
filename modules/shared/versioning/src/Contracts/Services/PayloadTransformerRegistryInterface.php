<?php

declare(strict_types=1);

namespace Academorix\Versioning\Contracts\Services;

use Academorix\ServiceProvider\Attributes\HydratesFrom;
use Academorix\Versioning\Attributes\AsPayloadTransformer;
use Academorix\Versioning\Services\PayloadTransformerRegistry;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Container\Attributes\Singleton;

/**
 * Registry of `#[AsPayloadTransformer]`-marked classes.
 *
 * A transformer is a pure function `transform(array): array` that
 * converts a payload from one version to the next on a single surface
 * (rest / webhook / graphql) for a single event / endpoint. The
 * registry maps a `(surface, event, from, to)` tuple to the FQCN of
 * the transformer class. Chained lookups walk the graph — e.g. `v1`
 * -> `v2` -> `v3` is two chained calls when no direct `v1 -> v3`
 * transformer is registered.
 *
 * Hydrated at boot by the framework's generic
 * {@see \Academorix\ServiceProvider\Bootstrappers\HydrationBootstrapper}
 * pump via the {@see HydratesFrom} attribute on {@see register()}.
 * Consumed by the webhook dispatcher, the REST envelope, and the
 * `versioning:transformers` command's introspection view.
 *
 * @category Versioning
 *
 * @since    0.1.0
 */
#[Bind(PayloadTransformerRegistry::class)]
#[Singleton]
interface PayloadTransformerRegistryInterface
{
    /**
     * Register a transformer discovered on a class.
     *
     * `#[HydratesFrom(AsPayloadTransformer::class)]` — the framework
     * scans every class carrying `#[AsPayloadTransformer]` at boot
     * and calls this method with `(className, attributeInstance)`.
     * Field extraction (`surface`, `event`, `from`, `to`) happens
     * inside the concrete registry so the hydration cache replay
     * feeds the same shape as the live scan. The concrete also
     * dispatches {@see \Academorix\Versioning\Events\PayloadTransformerRegistered}
     * on every successful registration.
     *
     * @param  class-string  $className  FQCN of the transformer class.
     * @param  AsPayloadTransformer  $attribute  The discovered
     *   attribute instance — carries `surface` / `event` / `from` /
     *   `to`.
     */
    #[HydratesFrom(AsPayloadTransformer::class)]
    public function register(string $className, AsPayloadTransformer $attribute): void;

    /**
     * Return the transformer FQCN for a single hop, or `null` when
     * no transformer is registered.
     *
     * @param  string  $surface  Surface identifier.
     * @param  string  $event    Event / endpoint identifier.
     * @param  string  $from     Source version slug.
     * @param  string  $to       Target version slug.
     * @return class-string|null
     */
    public function transformerFor(
        string $surface,
        string $event,
        string $from,
        string $to,
    ): ?string;

    /**
     * Return every registered transformer as an array of tuples for
     * introspection.
     *
     * @return list<array{surface: string, event: string, from: string, to: string, class: class-string}>
     */
    public function all(): array;
}
