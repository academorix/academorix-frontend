<?php

declare(strict_types=1);

namespace Stackra\Compliance\Contracts\Registry;

use Stackra\Compliance\Models\Subprocessor;
use Stackra\Compliance\Registry\DefaultSubprocessorRegistry;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Support\Collection;

/**
 * Lookup facade over the subprocessor table for the Trust Center
 * feed + DPA renderers.
 *
 * @category Compliance
 *
 * @since    0.1.0
 */
#[Bind(DefaultSubprocessorRegistry::class)]
interface SubprocessorRegistryInterface
{
    /**
     * Every active subprocessor, ordered by name.
     *
     * @return Collection<int, Subprocessor>
     */
    public function active(): Collection;

    /**
     * Every active subprocessor filtered by role.
     *
     * @return Collection<int, Subprocessor>
     */
    public function activeByRole(string $role): Collection;
}
