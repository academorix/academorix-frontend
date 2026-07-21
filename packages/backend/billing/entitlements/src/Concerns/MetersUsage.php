<?php

declare(strict_types=1);

namespace Stackra\Entitlements\Concerns;

use Stackra\Entitlements\Attributes\EnforcesEntitlement;
use Stackra\Entitlements\Contracts\Services\EnforcerInterface;
use Stackra\Entitlements\Exceptions\EntitlementExceededException;
use Stackra\Tenancy\Contracts\Services\TenantContextInterface;

/**
 * Mixed into models that consume metered features.
 *
 * Reads the `#[EnforcesEntitlement]` attribute on the model's public
 * methods at boot time and wires an automatic `saving` observer that
 * calls the enforcer before Eloquent writes the row.
 *
 * ```php
 * final class WebhookSubscription extends Model
 * {
 *     use MetersUsage;
 *
 *     #[EnforcesEntitlement(key: 'webhook.subscriptions.max')]
 *     public function save(): bool
 *     {
 *         return parent::save();
 *     }
 * }
 * ```
 *
 * @category Entitlements
 *
 * @since    0.1.0
 */
trait MetersUsage
{
    /**
     * Boot hook — inspect the class for `#[EnforcesEntitlement]` and
     * wire the `creating` observer callback.
     */
    protected static function bootMetersUsage(): void
    {
        static::creating(static function ($model): void {
            /** @var object $model */
            $reflection = new \ReflectionClass($model);
            foreach ($reflection->getMethods(\ReflectionMethod::IS_PUBLIC) as $method) {
                foreach ($method->getAttributes(EnforcesEntitlement::class) as $attribute) {
                    /** @var EnforcesEntitlement $enforces */
                    $enforces = $attribute->newInstance();

                    /** @var TenantContextInterface $tenantContext */
                    $tenantContext = \app(TenantContextInterface::class);
                    $tenant        = $tenantContext->currentOrFail();

                    /** @var EnforcerInterface $enforcer */
                    $enforcer = \app(EnforcerInterface::class);

                    // Pre-flight check; the enforcer records the row after
                    // the model save commits successfully.
                    if (! $enforcer->canConsume(
                        (string) $tenant->getKey(),
                        $enforces->key,
                        $enforces->amount,
                    )) {
                        throw EntitlementExceededException::forKey(
                            (string) $tenant->getKey(),
                            $enforces->key,
                        );
                    }
                }
            }
        });
    }
}
