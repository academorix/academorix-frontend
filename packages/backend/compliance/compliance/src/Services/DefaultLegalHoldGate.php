<?php

declare(strict_types=1);

namespace Academorix\Compliance\Services;

use Academorix\Compliance\Attributes\LegalHoldable;
use Academorix\Compliance\Contracts\Repositories\LegalHoldRepositoryInterface;
use Academorix\Compliance\Contracts\Services\LegalHoldGateInterface;
use Illuminate\Container\Attributes\Scoped;

/**
 * Default legal-hold gate.
 *
 * Registers every `#[LegalHoldable]`-marked class at boot; runtime
 * queries the LegalHold table via the repository to decide whether
 * a row is frozen.
 *
 * `#[Scoped]` — the underlying repository is request-scoped.
 *
 * @category Compliance
 *
 * @since    0.1.0
 */
#[Scoped]
final class DefaultLegalHoldGate implements LegalHoldGateInterface
{
    /**
     * Registered class-strings → attribute.
     *
     * @var array<class-string, LegalHoldable>
     */
    private array $registered = [];

    public function __construct(
        private readonly LegalHoldRepositoryInterface $holds,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function register(string $className, LegalHoldable $attribute): void
    {
        $this->registered[$className] = $attribute;
    }

    /**
     * {@inheritDoc}
     */
    public function isHeld(string $modelClass, string $subjectId): bool
    {
        if (! isset($this->registered[$modelClass])) {
            // The class opted out — treat as never-held to avoid
            // false positives blocking purges.
            return false;
        }

        $holds = $this->holds->findActiveForSubject($modelClass, $subjectId);

        return $holds->isNotEmpty();
    }

    /**
     * {@inheritDoc}
     */
    public function isTenantHeld(string $tenantId): bool
    {
        return $this->holds->findActiveForTenant($tenantId)->isNotEmpty();
    }

    /**
     * {@inheritDoc}
     */
    public function isClassHeld(string $modelClass): bool
    {
        return $this->holds->findActiveForClass($modelClass)->isNotEmpty();
    }
}
