<?php

declare(strict_types=1);

namespace Academorix\Storage\Services;

use Academorix\Storage\Attributes\FileKind;
use Academorix\Storage\Contracts\Services\FileKindRegistryInterface;
use Illuminate\Container\Attributes\Singleton;

/**
 * In-memory kind registry.
 *
 * Hydrated at boot by the framework's generic hydration pump
 * ({@see \Academorix\ServiceProvider\Bootstrappers\HydrationBootstrapper})
 * via the `#[HydratesFrom]` declaration on
 * {@see FileKindRegistryInterface::register()}. One row per class
 * carrying `#[FileKind]`. Read on every upload to validate MIME +
 * size without per-controller code.
 *
 * `#[Singleton]` — the catalogue is process-lifetime and stateless
 * per-request (the write path is boot-time only). The interface
 * declares the container binding via
 * `#[Bind(DefaultFileKindRegistry::class)]` (Pattern A per
 * `.kiro/steering/php-attributes.md`), so this concrete carries only
 * its lifetime attribute.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[Singleton]
final class DefaultFileKindRegistry implements FileKindRegistryInterface
{
    /**
     * Kind key → recipe map.
     *
     * @var array<string, array<string, mixed>>
     */
    private array $kinds = [];

    /**
     * {@inheritDoc}
     *
     * Last-registrant wins — downstream override upstream by
     * registering the same key later in the boot chain. Field
     * extraction happens here so the framework's hydration pump
     * doesn't need to know the domain shape of the kind catalogue.
     */
    public function register(string $className, FileKind $attribute): void
    {
        $this->kinds[$attribute->key] = [
            'maxSizeMb'         => $attribute->maxSizeMb,
            'allowedMimes'      => $attribute->allowedMimes,
            'generatesVariants' => $attribute->generatesVariants,
            'requiresVirusScan' => $attribute->requiresVirusScan,
            'dedupable'         => $attribute->dedupable,
            'disk'              => $attribute->disk,
            'source_class'      => $className,
        ];
    }

    /**
     * {@inheritDoc}
     */
    public function get(string $key): array
    {
        return $this->kinds[$key] ?? [];
    }

    /**
     * {@inheritDoc}
     */
    public function all(): array
    {
        return $this->kinds;
    }

    /**
     * {@inheritDoc}
     */
    public function has(string $key): bool
    {
        return isset($this->kinds[$key]);
    }
}
