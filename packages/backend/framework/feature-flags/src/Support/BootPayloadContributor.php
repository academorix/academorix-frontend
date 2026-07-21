<?php

declare(strict_types=1);

namespace Stackra\FeatureFlags\Support;

use Stackra\FeatureFlags\Contracts\FeatureCheckerInterface;
use Stackra\FeatureFlags\Registry\FeatureFlagRegistry;
use Stackra\Tenancy\Models\Tenant;
use Stackra\User\Models\User;
use Illuminate\Container\Attributes\Config;
use Psr\Log\LoggerInterface;
use Throwable;

/**
 * Contribute the compact `features: {name: bool}` map to `GET /api/v1/me`.
 *
 * Called by the tenancy package's boot-payload hook. Wraps the
 * batched `Checker::values()` call in a millisecond-budget timeout
 * so a slow resolver never blocks the response. On timeout /
 * exception the `features` key is omitted entirely and the rest
 * of the payload is unchanged (Requirement 7.6).
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
final class BootPayloadContributor
{
    /**
     * @param  FeatureFlagRegistry      $registry     Runtime registry — source of the flag list.
     * @param  FeatureCheckerInterface  $checker      Flag evaluation boundary.
     * @param  LoggerInterface          $logger       Failure logger — timeout / exception records here.
     * @param  int                      $timeoutMs    Millisecond budget for the batched call.
     */
    public function __construct(
        private readonly FeatureFlagRegistry $registry,
        private readonly FeatureCheckerInterface $checker,
        private readonly LoggerInterface $logger,
        #[Config('feature-flags.boot_payload_timeout_ms', 500)]
        private readonly int $timeoutMs = 500,
    ) {}

    /**
     * Build the `features` map for the boot payload.
     *
     * @param  Tenant|null  $tenant  Active tenant, or null.
     * @param  User|null    $user    Active user, or null.
     * @return array<string, bool>|null  Map keyed by flag name, or null on timeout / error (caller omits the key).
     */
    public function contribute(?Tenant $tenant, ?User $user): ?array
    {
        $names = $this->registry->names();
        if ($names === []) {
            return [];
        }

        $startMs = (int) (microtime(true) * 1000);

        try {
            $values = $this->checker->values($names, $tenant, $user);
        } catch (Throwable $error) {
            $this->logger->warning('feature-flags boot payload contribution failed', [
                'error' => $error->getMessage(),
            ]);

            return null;
        }

        $elapsedMs = (int) (microtime(true) * 1000) - $startMs;
        if ($elapsedMs > $this->timeoutMs) {
            $this->logger->warning('feature-flags boot payload exceeded timeout budget', [
                'elapsed_ms' => $elapsedMs,
                'budget_ms'  => $this->timeoutMs,
            ]);

            return null;
        }

        return $values;
    }
}
