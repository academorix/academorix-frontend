<?php

declare(strict_types=1);

namespace Academorix\Branding\Policies;

use Academorix\Branding\Contracts\Data\BrandingInterface;
use Academorix\Branding\Enums\BrandingPermission;
use Academorix\Branding\Models\Branding;
use Illuminate\Contracts\Auth\Authenticatable;

/**
 * Authorization policy for {@see Branding}.
 *
 * Dual-guard — platform admins have full CRUD; tenant admins scope to
 * their own tenant's rows via `belongsToCaller()`.
 *
 * @category Branding
 *
 * @since    0.1.0
 */
final class BrandingPolicy
{
    public function viewAny(Authenticatable $user): bool
    {
        return $user->can(BrandingPermission::View->value)
            || $user->can(BrandingPermission::Manage->value)
            || $user->can(BrandingPermission::ManageOwn->value);
    }

    public function view(Authenticatable $user, Branding $branding): bool
    {
        return $this->viewAny($user) && $this->belongsToCaller($user, $branding);
    }

    public function create(Authenticatable $user): bool
    {
        return $user->can(BrandingPermission::Manage->value)
            || $user->can(BrandingPermission::ManageOwn->value);
    }

    public function update(Authenticatable $user, Branding $branding): bool
    {
        return $this->create($user) && $this->belongsToCaller($user, $branding);
    }

    public function delete(Authenticatable $user, Branding $branding): bool
    {
        return $this->update($user, $branding);
    }

    /**
     * Platform admins bypass; tenant admins must match tenant.
     */
    private function belongsToCaller(Authenticatable $user, Branding $branding): bool
    {
        if ($user->can(BrandingPermission::Manage->value) || $user->can(BrandingPermission::View->value)) {
            return true;
        }

        $callerTenantId = \method_exists($user, 'getAttribute')
            ? $user->getAttribute('tenant_id')
            : null;

        return \is_string($callerTenantId)
            && $callerTenantId === $branding->{BrandingInterface::ATTR_TENANT_ID};
    }
}
