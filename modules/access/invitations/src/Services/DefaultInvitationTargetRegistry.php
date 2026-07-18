<?php

declare(strict_types=1);

namespace Academorix\Invitations\Services;

use Academorix\Invitations\Attributes\Invitable;
use Academorix\Invitations\Contracts\Services\InvitationTargetRegistryInterface;
use Illuminate\Container\Attributes\Singleton;
use Illuminate\Database\Eloquent\Model;

/**
 * In-memory implementation of {@see InvitationTargetRegistryInterface}.
 *
 * Hydrated at boot by the framework's generic hydration pump
 * ({@see \Academorix\ServiceProvider\Bootstrappers\HydrationBootstrapper})
 * via the `#[HydratesFrom(Invitable::class)]` declaration on
 * {@see InvitationTargetRegistryInterface::register()}. Every
 * consumer module that owns an invitable target marks its Eloquent
 * model with `#[Invitable(...)]`; this registry never learns of
 * concrete targets any other way.
 *
 * Idempotent — a second registration of the same `(class, attribute)`
 * tuple overwrites the previous row with the same content. Attributes
 * flagged `enabled: false` are silently skipped.
 *
 * `#[Singleton]` — the catalogue is process-lifetime and stateless
 * per-request (the write path is boot-time only).
 *
 * @category Invitations
 *
 * @since    0.1.0
 */
#[Singleton]
final class DefaultInvitationTargetRegistry implements InvitationTargetRegistryInterface
{
    /**
     * Registry keyed by morph-map key.
     *
     * @var array<string, array{model: class-string<Model>, accept_handler: class-string|null}>
     */
    private array $targets = [];

    /**
     * Reverse index — FQCN → morph-map key. Populated in lock-step
     * with the primary map so {@see normalise()} is an O(1) lookup.
     *
     * @var array<class-string, string>
     */
    private array $reverseIndex = [];

    /**
     * {@inheritDoc}
     */
    public function register(string $className, Invitable $attribute): void
    {
        // Feature-flag toggle — the attribute stays on the class so
        // it's easy to re-enable, but the registry never sees it.
        if ($attribute->enabled === false) {
            return;
        }

        $this->targets[$attribute->key] = [
            'model'          => $className,
            'accept_handler' => $attribute->acceptHandler,
        ];
        $this->reverseIndex[$className] = $attribute->key;
    }

    /**
     * {@inheritDoc}
     */
    public function has(string $key): bool
    {
        return isset($this->targets[$key]);
    }

    /**
     * {@inheritDoc}
     */
    public function modelFor(string $key): ?string
    {
        return $this->targets[$key]['model'] ?? null;
    }

    /**
     * {@inheritDoc}
     */
    public function acceptHandlerFor(string $key): ?string
    {
        return $this->targets[$key]['accept_handler'] ?? null;
    }

    /**
     * {@inheritDoc}
     */
    public function keys(): array
    {
        return \array_keys($this->targets);
    }

    /**
     * {@inheritDoc}
     */
    public function all(): array
    {
        return $this->targets;
    }

    /**
     * {@inheritDoc}
     */
    public function normalise(string $value): string
    {
        if (isset($this->targets[$value])) {
            return $value;
        }

        if (isset($this->reverseIndex[$value])) {
            return $this->reverseIndex[$value];
        }

        return $value;
    }
}
