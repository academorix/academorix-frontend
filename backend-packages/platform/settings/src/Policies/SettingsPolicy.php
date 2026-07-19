<?php

declare(strict_types=1);

namespace Academorix\Settings\Policies;

use Academorix\Settings\Contracts\Data\SettingValueInterface;
use Academorix\Settings\Enums\SettingScopeKind;
use Academorix\Settings\Enums\SettingsPermission;
use Academorix\Settings\Models\SettingValue;
use Academorix\Settings\Models\SettingsSchema;
use Illuminate\Contracts\Auth\Authenticatable;

/**
 * Authorization policy for every {@see SettingValue} write.
 *
 * Dual-guard — platform admins manage system-scope values; tenant
 * admins manage tenant-scope overrides for their own tenant. User-
 * scope writes require the caller to own the row (`scope_id` matches
 * the caller's user id).
 *
 * @category Settings
 *
 * @since    0.1.0
 */
final class SettingsPolicy
{
    /**
     * View any settings row.
     */
    public function viewAny(Authenticatable $user): bool
    {
        return $user->can(SettingsPermission::View->value)
            || $user->can(SettingsPermission::Manage->value)
            || $user->can(SettingsPermission::ManageOwn->value);
    }

    /**
     * View a single value.
     */
    public function view(Authenticatable $user, SettingValue $value): bool
    {
        if (! $this->viewAny($user)) {
            return false;
        }

        return $this->belongsToCaller($user, $value);
    }

    /**
     * Create a new value at the caller's scope. Callers with `Manage`
     * may target any scope; `ManageOwn` limits writes to `tenant`
     * (and `user` for own-user rows).
     */
    public function create(Authenticatable $user): bool
    {
        return $user->can(SettingsPermission::Manage->value)
            || $user->can(SettingsPermission::ManageOwn->value);
    }

    /**
     * Update a persisted value.
     *
     * The `$schema` context lets policies gate updates by the field's
     * `is_system` flag — even a platform admin cannot write to a
     * user-only field at tenant scope.
     */
    public function update(Authenticatable $user, SettingValue $value, SettingsSchema $schema): bool
    {
        if (! $this->create($user)) {
            return false;
        }

        if (! $this->belongsToCaller($user, $value)) {
            return false;
        }

        // Schema-locked system fields refuse tenant / user writes.
        if ($schema->{\Academorix\Settings\Contracts\Data\SettingsSchemaInterface::ATTR_IS_SYSTEM} === true
            && $value->{SettingValueInterface::ATTR_SCOPE_KIND} !== SettingScopeKind::System
            && ! $user->can(SettingsPermission::Manage->value)) {
            return false;
        }

        return true;
    }

    /**
     * Delete an override — a hard delete since clearing an override
     * is what falls the resolver through to the next scope.
     */
    public function delete(Authenticatable $user, SettingValue $value): bool
    {
        return $this->create($user) && $this->belongsToCaller($user, $value);
    }

    /**
     * Platform admins bypass; tenant admins must match tenant; users
     * writing user-scope must match their own id.
     */
    private function belongsToCaller(Authenticatable $user, SettingValue $value): bool
    {
        if ($user->can(SettingsPermission::Manage->value)
            || $user->can(SettingsPermission::View->value)) {
            return true;
        }

        $scopeKind = $value->{SettingValueInterface::ATTR_SCOPE_KIND};
        $scopeId   = $value->{SettingValueInterface::ATTR_SCOPE_ID};

        // System-scope reads always pass; system-scope writes never do
        // (caught by the schema-locked branch above).
        if ($scopeKind === SettingScopeKind::System) {
            return true;
        }

        if ($scopeKind === SettingScopeKind::Tenant) {
            $callerTenantId = \method_exists($user, 'getAttribute')
                ? $user->getAttribute('tenant_id')
                : null;

            return \is_string($callerTenantId)
                && $callerTenantId === $value->{SettingValueInterface::ATTR_TENANT_ID};
        }

        if ($scopeKind === SettingScopeKind::User) {
            $callerId = \method_exists($user, 'getAuthIdentifier')
                ? (string) $user->getAuthIdentifier()
                : '';

            return $callerId !== '' && $callerId === (string) $scopeId;
        }

        return false;
    }
}
