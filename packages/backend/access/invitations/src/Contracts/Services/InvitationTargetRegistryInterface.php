<?php

declare(strict_types=1);

namespace Stackra\Invitations\Contracts\Services;

use Stackra\Invitations\Attributes\Invitable;
use Stackra\Invitations\Services\DefaultInvitationTargetRegistry;
use Stackra\ServiceProvider\Attributes\HydratesFrom;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Container\Attributes\Singleton;
use Illuminate\Database\Eloquent\Model;

/**
 * Container binding every consumer module registers its invitable
 * resources against at boot.
 *
 * The invitations module never name-drops a concrete target
 * (`Tenant`, `Team`, `Athlete`, ...) — consumer modules mark their
 * Eloquent model with `#[Invitable(key: '<morph-key>', ...)]` and the
 * framework's generic
 * {@see \Stackra\ServiceProvider\Bootstrappers\HydrationBootstrapper}
 * pump calls {@see self::register()} on every hit at app boot. The
 * attribute carries:
 *
 *   - a morph-map key (`tenant`, `team`, `athlete`, ...),
 *   - the concrete Eloquent model class (the discovered target),
 *   - an optional accept-handler class that finalises the accept
 *     flow (creates the User, assigns the role, applies grants),
 *   - an `enabled` toggle so consumers can feature-flag a target
 *     off without deleting the attribute.
 *
 * The registry powers three lookups:
 *
 *   - MorphTo resolution at hydrate time (`target()` relation on
 *     {@see \Stackra\Invitations\Models\Invitation}),
 *   - target-type validation for the
 *     {@see \Stackra\Invitations\Rules\InvitationTargetRegistered}
 *     rule,
 *   - accept-handler dispatch on the acceptance flow.
 *
 * @category Invitations
 *
 * @since    0.1.0
 */
#[Bind(DefaultInvitationTargetRegistry::class)]
#[Singleton]
interface InvitationTargetRegistryInterface
{
    /**
     * Register a discovered invitable target.
     *
     * `#[HydratesFrom(Invitable::class)]` — the framework's generic
     * hydration pump scans every class carrying `#[Invitable]` at
     * boot and calls this method with `(className, attributeInstance)`.
     * The concrete extracts the morph-map key, optional accept-
     * handler class, and honours the attribute's `enabled` toggle.
     *
     * Idempotent — the second registration of the same class is a
     * no-op at the storage level (the second write overwrites the
     * first with the same tuple).
     *
     * @param  class-string<Model>  $className  FQCN of the invitable Eloquent model.
     * @param  Invitable            $attribute  The discovered attribute instance.
     */
    #[HydratesFrom(Invitable::class)]
    public function register(string $className, Invitable $attribute): void;

    /**
     * Whether a morph-map key is registered.
     */
    public function has(string $key): bool;

    /**
     * Resolve the concrete model class for a morph-map key.
     *
     * @return class-string<Model>|null
     */
    public function modelFor(string $key): ?string;

    /**
     * Resolve the accept-handler class for a morph-map key.
     *
     * @return class-string|null
     */
    public function acceptHandlerFor(string $key): ?string;

    /**
     * Every registered morph-map key.
     *
     * @return list<string>
     */
    public function keys(): array;

    /**
     * Full registry snapshot keyed by morph-map key.
     *
     * @return array<string, array{model: class-string<Model>, accept_handler: class-string|null}>
     */
    public function all(): array;

    /**
     * Normalise an arbitrary target reference (morph key OR FQCN) to
     * the canonical morph-map key. Returns the raw value when the
     * registry cannot resolve it.
     */
    public function normalise(string $value): string;
}
