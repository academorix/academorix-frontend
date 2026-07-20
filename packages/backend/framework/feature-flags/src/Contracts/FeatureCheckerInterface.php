<?php

declare(strict_types=1);

namespace Academorix\FeatureFlags\Contracts;

use Academorix\FeatureFlags\Checkers\PennantFeatureChecker;
use Academorix\FeatureFlags\Resolver\FeatureResolution;
use Academorix\Tenancy\Models\Tenant;
use Academorix\User\Models\User;
use BackedEnum;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Container\Attributes\Scoped;
use InvalidArgumentException;
use RuntimeException;

/**
 * Single contract every non-package consumer routes through for flag evaluation.
 *
 * Four methods (`active`, `inactive`, `values`, `resolution`)
 * materialise the KillSwitch → Override → Rollout → PlanGate →
 * class-default chain (Requirement 3) as a boolean or a
 * {@see FeatureResolution}. Direct `Laravel\Pennant\Feature::`
 * calls outside the package are forbidden — enforced by
 * `NoDirectPennantAccessRule` (Requirement 4.9).
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
#[Bind(PennantFeatureChecker::class)]
#[Scoped]
interface FeatureCheckerInterface
{
    /**
     * Resolve `$flag` for the caller's context and return whether it is on.
     *
     * @param  string|BackedEnum  $flag    Flag identifier — non-empty string of 1..191 chars, or BackedEnum whose value is such a string.
     * @param  Tenant|null        $tenant  Optional tenant; resolved from tenancy context helper when null (Req 4.10).
     * @param  User|null          $user    Optional user; null is legal (Req 4.12).
     * @return bool                        `true` when the composed resolver's final decision is on.
     *
     * @throws InvalidArgumentException  When `$flag` fails identifier validation (Req 4.4).
     * @throws RuntimeException          When no tenant is available (Req 4.11).
     */
    public function active(string|BackedEnum $flag, ?Tenant $tenant = null, ?User $user = null): bool;

    /**
     * Strict negation of {@see active()} — return true when the flag is off.
     *
     * @param  string|BackedEnum  $flag    Flag identifier.
     * @param  Tenant|null        $tenant  Optional tenant; auto-resolved when null.
     * @param  User|null          $user    Optional user.
     * @return bool
     *
     * @throws InvalidArgumentException
     * @throws RuntimeException
     */
    public function inactive(string|BackedEnum $flag, ?Tenant $tenant = null, ?User $user = null): bool;

    /**
     * Batch-resolve 1..100 flags in a single call.
     *
     * Consumed by the `GET /api/v1/me` boot payload — one call per
     * request. Empty input short-circuits to `[]` (Req 4.6).
     *
     * @param  array<int, string|BackedEnum>  $flags   0..100 flag identifiers.
     * @param  Tenant|null                    $tenant  Optional tenant.
     * @param  User|null                      $user    Optional user.
     * @return array<string, bool>                    Map keyed by resolved flag name.
     *
     * @throws InvalidArgumentException  When the list is too long or contains an invalid element (Req 4.7).
     * @throws RuntimeException          When no tenant is available for a non-empty list (Req 4.11).
     */
    public function values(array $flags, ?Tenant $tenant = null, ?User $user = null): array;

    /**
     * Return the full resolution — value plus deciding source.
     *
     * @param  string|BackedEnum  $flag    Flag identifier.
     * @param  Tenant|null        $tenant  Optional tenant.
     * @param  User|null          $user    Optional user.
     * @return FeatureResolution           Immutable value + source pair.
     *
     * @throws InvalidArgumentException
     * @throws RuntimeException
     */
    public function resolution(string|BackedEnum $flag, ?Tenant $tenant = null, ?User $user = null): FeatureResolution;
}
