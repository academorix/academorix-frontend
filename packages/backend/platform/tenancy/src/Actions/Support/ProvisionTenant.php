<?php

declare(strict_types=1);

namespace Stackra\Tenancy\Actions\Support;

use Stackra\Tenancy\Contracts\Repositories\TenantRepositoryInterface;
use Stackra\Tenancy\Data\Requests\CreateTenantRequestData;
use Stackra\Tenancy\Enums\TenantStatus;
use Stackra\Tenancy\Events\TenantProvisioned;
use Stackra\Tenancy\Events\TenantProvisioning;
use Stackra\Tenancy\Exceptions\SlugTakenException;
use Stackra\Tenancy\Models\Tenant;
use Illuminate\Support\Facades\DB;

/**
 * Multi-write orchestrator for tenant provisioning.
 *
 * Wraps the whole transaction:
 *   1. Create the Tenant row (fires `TenantProvisioning` inside tx).
 *   2. Downstream listeners of `TenantProvisioning` may piggy-back
 *      (create default Organization, default Branch, owner user).
 *   3. Fire `TenantProvisioned` post-commit for outbound side effects
 *      (welcome email, DNS setup, index build).
 *
 * Refuses if the `(application_id, slug)` pair already exists.
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
final class ProvisionTenant
{
    public function __construct(
        private readonly TenantRepositoryInterface $tenants,
    ) {
    }

    /**
     * Provision a new Tenant.
     */
    public function handle(CreateTenantRequestData $data): Tenant
    {
        if ($this->tenants->findBySlug($data->applicationId, $data->slug) !== null) {
            throw new SlugTakenException(\sprintf(
                'Slug "%s" is already taken on application %s.',
                $data->slug,
                $data->applicationId,
            ));
        }

        $tenant = DB::transaction(function () use ($data): Tenant {
            $row = $this->tenants->create([
                'application_id' => $data->applicationId,
                'slug'           => $data->slug,
                'name'           => $data->name,
                'legal_name'     => $data->legalName,
                'business_type'  => $data->businessType->value,
                'locale'         => $data->locale,
                'timezone'       => $data->timezone,
                'currency'       => $data->currency,
                'country_code'   => $data->countryCode,
                'status'         => TenantStatus::Trialing->value,
            ]);

            // Fire inside the transaction so same-tx sub-provisioners
            // (default Organization, default Branch, owner User) land
            // in the same commit as the tenant row.
            TenantProvisioning::dispatch($row);

            return $row;
        });

        // Fire AFTER commit for outbound side effects.
        TenantProvisioned::dispatch($tenant);

        return $tenant;
    }
}
