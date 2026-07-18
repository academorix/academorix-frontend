<?php

declare(strict_types=1);

namespace Academorix\Compliance\Contracts\Services;

use Academorix\Compliance\Attributes\LegalHoldable;
use Academorix\Compliance\Services\DefaultLegalHoldGate;
use Academorix\ServiceProvider\Attributes\HydratesFrom;
use Illuminate\Container\Attributes\Bind;

/**
 * Freeze-check gate for the legal-hold policy.
 *
 * Hydrated at boot from every `#[LegalHoldable]`-marked class so
 * every purge / erase call can query the gate before touching a
 * row.
 *
 * @category Compliance
 *
 * @since    0.1.0
 */
#[Bind(DefaultLegalHoldGate::class)]
interface LegalHoldGateInterface
{
    /**
     * Register a `#[LegalHoldable]` class.
     *
     * @param  class-string   $className  FQCN of the model.
     * @param  LegalHoldable  $attribute  The discovered attribute instance.
     */
    #[HydratesFrom(LegalHoldable::class)]
    public function register(string $className, LegalHoldable $attribute): void;

    /**
     * Whether a specific subject on a specific model class is under
     * an active hold.
     *
     * @param  class-string  $modelClass   FQCN of the target model.
     * @param  string        $subjectId    Subject id on the row.
     */
    public function isHeld(string $modelClass, string $subjectId): bool;

    /**
     * Whether a whole tenant is under an active hold.
     */
    public function isTenantHeld(string $tenantId): bool;

    /**
     * Whether a specific model class is under a class-level hold.
     *
     * @param  class-string  $modelClass  FQCN of the target model.
     */
    public function isClassHeld(string $modelClass): bool;
}
