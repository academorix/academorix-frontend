<?php

declare(strict_types=1);

namespace Stackra\Compliance\Registry;

use Stackra\Compliance\Attributes\DsarExportable;
use Stackra\Compliance\Contracts\Registry\DsarContributorRegistryInterface;
use Illuminate\Container\Attributes\Singleton;

/**
 * In-memory registry of every `#[DsarExportable]` model.
 *
 * Hydrated at boot by the framework's generic hydration pump.
 * Consumers iterate the registry in priority order when assembling
 * a subject's DSAR bundle.
 *
 * @category Compliance
 *
 * @since    0.1.0
 */
#[Singleton]
final class DefaultDsarContributorRegistry implements DsarContributorRegistryInterface
{
    /**
     * Registered contributors, keyed by class-string.
     *
     * @var array<class-string, DsarExportable>
     */
    private array $contributors = [];

    /**
     * {@inheritDoc}
     */
    public function register(string $className, DsarExportable $attribute): void
    {
        $this->contributors[$className] = $attribute;
    }

    /**
     * {@inheritDoc}
     */
    public function all(): array
    {
        $entries = [];
        foreach ($this->contributors as $class => $attribute) {
            $entries[] = [
                'class'     => $class,
                'attribute' => $attribute,
            ];
        }

        \usort(
            $entries,
            static fn (array $a, array $b): int => $a['attribute']->priority <=> $b['attribute']->priority,
        );

        return $entries;
    }

    /**
     * {@inheritDoc}
     */
    public function has(string $className): bool
    {
        return isset($this->contributors[$className]);
    }
}
