<?php

declare(strict_types=1);

namespace Stackra\Compliance\Services;

use Stackra\Compliance\Contracts\Data\SubprocessorInterface;
use Stackra\Compliance\Contracts\Repositories\SubprocessorRepositoryInterface;
use Stackra\Compliance\Contracts\Services\SubprocessorRegistryInterface;
use Stackra\Compliance\Models\Subprocessor;
use Illuminate\Container\Attributes\Scoped;
use Illuminate\Support\Collection;

/**
 * Read-facade over the subprocessor table.
 *
 * @category Compliance
 *
 * @since    0.1.0
 */
#[Scoped]
final class DefaultSubprocessorRegistry implements SubprocessorRegistryInterface
{
    public function __construct(
        private readonly SubprocessorRepositoryInterface $subprocessors,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function active(): Collection
    {
        return $this->subprocessors->findActive();
    }

    /**
     * {@inheritDoc}
     */
    public function activeByRole(string $role): Collection
    {
        return $this->subprocessors->findActive()->filter(
            static fn (Subprocessor $s): bool => (string) $s->{SubprocessorInterface::ATTR_ROLE} === $role,
        )->values();
    }
}
