<?php

declare(strict_types=1);

namespace Stackra\Audit\Services;

use Stackra\Audit\Attributes\Auditable;
use Stackra\Audit\Contracts\Services\AuditRegistryInterface;
use Illuminate\Container\Attributes\Singleton;

/**
 * Default runtime registry of `#[Auditable]` classes.
 *
 * ## Storage shape
 *
 * `[<class-string> => list<string>]` — model FQCN → encrypt-field
 * list. Hydrated at boot by the framework's generic hydration pump
 * ({@see \Stackra\ServiceProvider\Bootstrappers\HydrationBootstrapper})
 * via the `#[HydratesFrom]` declaration on
 * {@see AuditRegistryInterface::register()}. Queried by
 * {@see \Stackra\Audit\Casts\EncryptedAuditValueCast} on every
 * model attribute cast.
 *
 * ## Duplicate registration
 *
 * Registering the same class twice is idempotent — the second call
 * overwrites the first entry. This keeps discovery re-runnable in
 * tests without forcing consumers to reset state.
 *
 * `#[Singleton]` because the registry is a pure function of the
 * composer manifest — same output every boot, safely shared across
 * every request under Octane.
 *
 * @category Audit
 *
 * @since    0.1.0
 */
#[Singleton]
final class AuditRegistry implements AuditRegistryInterface
{
    /**
     * The registry state.
     *
     * @var array<class-string, list<string>>
     */
    private array $entries = [];

    /**
     * {@inheritDoc}
     */
    public function register(string $className, Auditable $attribute): void
    {
        // Normalise duplicates in the encrypt-list to keep the cast's
        // membership check cheap + deterministic. `array_values`
        // discards any string keys the caller may have supplied. The
        // `chainEnabled` flag on the attribute is not stored here —
        // consumers that need it re-read `#[Auditable]` off the class
        // directly, which is O(1) with the composer attribute manifest.
        $this->entries[$className] = \array_values(\array_unique($attribute->encryptFields));
    }

    /**
     * {@inheritDoc}
     */
    public function encryptedFieldsFor(string $className): array
    {
        return $this->entries[$className] ?? [];
    }

    /**
     * {@inheritDoc}
     */
    public function all(): array
    {
        return $this->entries;
    }
}
