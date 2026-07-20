<?php

declare(strict_types=1);

namespace Academorix\Versioning\Services;

use Academorix\Versioning\Attributes\AsPayloadTransformer;
use Academorix\Versioning\Contracts\Services\PayloadTransformerRegistryInterface;
use Academorix\Versioning\Events\PayloadTransformerRegistered;
use Illuminate\Container\Attributes\Singleton;

/**
 * In-memory {@see PayloadTransformerRegistryInterface}.
 *
 * Keys entries as `<surface>:<event>:<from>:<to>` for O(1) lookup.
 * Hydrated at boot by the framework's generic hydration pump
 * ({@see \Academorix\ServiceProvider\Bootstrappers\HydrationBootstrapper})
 * via the `#[HydratesFrom]` declaration on
 * {@see PayloadTransformerRegistryInterface::register()}.
 *
 * `#[Singleton]` — the catalogue is a pure function of the composer
 * manifest, safe to share across the worker pool.
 *
 * @category Versioning
 *
 * @since    0.1.0
 */
#[Singleton]
final class PayloadTransformerRegistry implements PayloadTransformerRegistryInterface
{
    /**
     * Key -> transformer FQCN.
     *
     * @var array<string, class-string>
     */
    private array $transformers = [];

    /**
     * {@inheritDoc}
     */
    public function register(string $className, AsPayloadTransformer $attribute): void
    {
        /** @var class-string $className */
        $this->transformers[$this->keyFor(
            $attribute->surface,
            $attribute->event,
            $attribute->from,
            $attribute->to,
        )] = $className;

        // Fire the same discovery event the old bootstrapper fired so
        // downstream listeners (audit logging, admin surface refresh)
        // observe every registration — including cache-replay ones.
        PayloadTransformerRegistered::dispatch(
            $attribute->surface,
            $attribute->event,
            $attribute->from,
            $attribute->to,
            $className,
        );
    }

    /**
     * {@inheritDoc}
     */
    public function transformerFor(
        string $surface,
        string $event,
        string $from,
        string $to,
    ): ?string {
        return $this->transformers[$this->keyFor($surface, $event, $from, $to)] ?? null;
    }

    /**
     * {@inheritDoc}
     */
    public function all(): array
    {
        $rows = [];
        foreach ($this->transformers as $key => $className) {
            [$surface, $event, $from, $to] = \explode(':', $key, 4);
            $rows[] = [
                'surface' => $surface,
                'event'   => $event,
                'from'    => $from,
                'to'      => $to,
                'class'   => $className,
            ];
        }

        return $rows;
    }

    /**
     * Build the storage key for a `(surface, event, from, to)` tuple.
     */
    private function keyFor(string $surface, string $event, string $from, string $to): string
    {
        return \sprintf('%s:%s:%s:%s', $surface, $event, $from, $to);
    }
}
