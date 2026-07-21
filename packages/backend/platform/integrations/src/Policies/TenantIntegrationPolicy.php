<?php

declare(strict_types=1);

namespace Stackra\Integrations\Policies;

use Stackra\Integrations\Contracts\Data\TenantIntegrationInterface;
use Stackra\Integrations\Enums\IntegrationsPermission;
use Stackra\Integrations\Models\TenantIntegration;
use Illuminate\Contracts\Auth\Authenticatable;

/**
 * Authorization policy for {@see TenantIntegration}.
 *
 * Dual-guard — platform admins have full CRUD across every tenant's
 * integrations; tenant admins scope to their own tenant's rows via
 * `belongsToCaller()`.
 *
 * @category Integrations
 *
 * @since    0.1.0
 */
final class TenantIntegrationPolicy
{
    public function viewAny(Authenticatable $user): bool
    {
        return $user->can(IntegrationsPermission::View->value)
            || $user->can(IntegrationsPermission::Manage->value)
            || $user->can(IntegrationsPermission::ManageOwn->value);
    }

    public function view(Authenticatable $user, TenantIntegration $integration): bool
    {
        return $this->viewAny($user) && $this->belongsToCaller($user, $integration);
    }

    public function create(Authenticatable $user): bool
    {
        return $user->can(IntegrationsPermission::Manage->value)
            || $user->can(IntegrationsPermission::ManageOwn->value);
    }

    public function update(Authenticatable $user, TenantIntegration $integration): bool
    {
        return $this->create($user) && $this->belongsToCaller($user, $integration);
    }

    public function delete(Authenticatable $user, TenantIntegration $integration): bool
    {
        return $this->update($user, $integration);
    }

    /**
     * Platform admins bypass; tenant admins must match tenant.
     */
    private function belongsToCaller(Authenticatable $user, TenantIntegration $integration): bool
    {
        if ($user->can(IntegrationsPermission::Manage->value) || $user->can(IntegrationsPermission::View->value)) {
            return true;
        }

        $callerTenantId = \method_exists($user, 'getAttribute')
            ? $user->getAttribute('tenant_id')
            : null;

        return \is_string($callerTenantId)
            && $callerTenantId === $integration->{TenantIntegrationInterface::ATTR_TENANT_ID};
    }
}
