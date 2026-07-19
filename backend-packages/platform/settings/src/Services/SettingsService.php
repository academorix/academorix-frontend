<?php

declare(strict_types=1);

namespace Academorix\Settings\Services;

use Academorix\Settings\Contracts\Data\SettingsSchemaInterface;
use Academorix\Settings\Contracts\Repositories\SettingsGroupRepositoryInterface;
use Academorix\Settings\Contracts\Repositories\SettingsSchemaRepositoryInterface;
use Academorix\Settings\Contracts\Services\SettingsRegistryInterface;
use Academorix\Settings\Contracts\Services\SettingsResolverInterface;
use Academorix\Settings\Contracts\Services\SettingsServiceInterface;
use Academorix\Settings\Contracts\Services\SettingsWriterInterface;
use Academorix\Settings\Enums\SettingScopeKind;
use Academorix\Settings\Exceptions\SettingsGroupNotFoundException;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Container\Attributes\Scoped;
use Illuminate\Contracts\Auth\Authenticatable;

/**
 * Public facade combining resolver + writer + registry.
 *
 * The one surface every consumer should type-hint. Reads dispatch to
 * the resolver; writes dispatch to the writer; schema + group listings
 * come from the registry. `#[Scoped]` — pulls the current user off
 * the container per request.
 *
 * @category Settings
 *
 * @since    0.1.0
 */
#[Scoped]
final class SettingsService implements SettingsServiceInterface
{
    public function __construct(
        private readonly SettingsResolverInterface $resolver,
        private readonly SettingsWriterInterface $writer,
        private readonly SettingsRegistryInterface $registry,
        private readonly SettingsGroupRepositoryInterface $groups,
        private readonly SettingsSchemaRepositoryInterface $schemas,
        #[CurrentUser]
        private readonly ?Authenticatable $user = null,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function get(string $key, mixed $default = null): mixed
    {
        $tenantId = $this->currentTenantId();
        $userId   = $this->currentUserId();

        $resolved = $this->resolver->resolve($key, $tenantId, $userId);

        return $resolved ?? $default;
    }

    /**
     * {@inheritDoc}
     */
    public function set(string $key, mixed $value): void
    {
        [$scopeKind, $scopeId] = $this->deriveWriteScope();

        $this->writer->write($key, $value, $scopeKind, $scopeId);
    }

    /**
     * {@inheritDoc}
     */
    public function all(string $group): array
    {
        $fields = $this->registry->fields($group);
        if ($fields === []) {
            throw new SettingsGroupNotFoundException(\sprintf(
                'No settings group registered under "%s".',
                $group,
            ));
        }

        $out = [];
        foreach ($fields as $field) {
            $key       = (string) ($field['key'] ?? '');
            $out[$key] = $this->get($key, $field['default'] ?? null);
        }

        return $out;
    }

    /**
     * {@inheritDoc}
     */
    public function schema(string $group): array
    {
        $meta = $this->registry->groups()[$group] ?? null;
        if ($meta === null) {
            throw new SettingsGroupNotFoundException(\sprintf(
                'No settings group registered under "%s".',
                $group,
            ));
        }

        $groupRow = $this->groups->findByKey($group);
        $fields   = [];

        if ($groupRow !== null) {
            foreach ($this->schemas->findByGroup((string) $groupRow->getKey()) as $schema) {
                $fields[] = [
                    'key'       => $schema->{SettingsSchemaInterface::ATTR_KEY},
                    'label'     => $schema->{SettingsSchemaInterface::ATTR_LABEL},
                    'type'      => $schema->{SettingsSchemaInterface::ATTR_TYPE},
                    'rules'     => $schema->{SettingsSchemaInterface::ATTR_RULES},
                    'sensitive' => (bool) $schema->{SettingsSchemaInterface::ATTR_SENSITIVE},
                    'sort_order'=> (int) $schema->{SettingsSchemaInterface::ATTR_SORT_ORDER},
                ];
            }
        }

        return [
            'group'  => $meta,
            'fields' => $fields,
        ];
    }

    /**
     * Choose the write scope for the current caller. Users writing to
     * a group whose `#[AsSetting(scope: '...')]` is `user` land in the
     * user scope; every other write lands at tenant scope. Platform
     * admins with `Manage` land at system scope from separate actions.
     *
     * @return array{0: string, 1: string|null}  `[scope_kind, scope_id]`
     */
    private function deriveWriteScope(): array
    {
        $tenantId = $this->currentTenantId();
        $userId   = $this->currentUserId();

        if ($tenantId !== null) {
            return [SettingScopeKind::Tenant->value, $tenantId];
        }

        if ($userId !== null) {
            return [SettingScopeKind::User->value, $userId];
        }

        return [SettingScopeKind::System->value, null];
    }

    /**
     * Extract the caller's active tenant id, or NULL when running
     * outside a resolved tenant context.
     */
    private function currentTenantId(): ?string
    {
        if ($this->user === null || ! \method_exists($this->user, 'getAttribute')) {
            return null;
        }

        $tenantId = $this->user->getAttribute('tenant_id');

        return \is_string($tenantId) && $tenantId !== '' ? $tenantId : null;
    }

    /**
     * Extract the caller's user id.
     */
    private function currentUserId(): ?string
    {
        if ($this->user === null) {
            return null;
        }

        $id = $this->user->getAuthIdentifier();

        return $id === null ? null : (string) $id;
    }
}
