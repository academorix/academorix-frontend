<?php

declare(strict_types=1);

namespace Academorix\Compliance\Services;

use Academorix\Compliance\Contracts\Data\SubprocessorInterface;
use Academorix\Compliance\Contracts\Repositories\SubprocessorRepositoryInterface;
use Academorix\Compliance\Contracts\Services\SubprocessorRegistryInterface;
use Academorix\Compliance\Models\Subprocessor;
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
