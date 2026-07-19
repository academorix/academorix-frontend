<?php

declare(strict_types=1);

namespace Academorix\Settings\Actions;

use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Academorix\Settings\Contracts\SettingsRegistryInterface;
use Academorix\Settings\Contracts\SettingsServiceInterface;

/**
 * `GET /api/v1/settings` — list every registered group with its
 * currently-resolved values.
 *
 * Convenience wrapper over the schema endpoint. Consumers
 * building a "Settings" landing page use this to discover which
 * groups exist without walking the full field schema.
 *
 * Hierarchy resolution happens inside the service via the scope
 * substrate — the active scope context (established by the
 * `scope` middleware) determines the cascade.
 *
 * @category Settings
 *
 * @since    0.1.0
 */
#[AsAction(name: 'settings.list')]
#[Get(
    uri: '/api/v1/settings',
    name: 'settings.list',
    summary: 'List every settings group with resolved values.',
    tags: ['Settings'],
    responseType: 'array',
    responseCode: 200,
)]
#[Middleware(['api', 'tenant', 'auth:sanctum'])]
final class ListSettings
{
    use AsController;

    /**
     * @param  SettingsRegistryInterface  $registry  Registry for enumerating groups.
     * @param  SettingsServiceInterface  $settings  Service for resolving values per group.
     */
    public function __construct(
        private readonly SettingsRegistryInterface $registry,
        private readonly SettingsServiceInterface $settings,
    ) {}

    /**
     * Return every group with its resolved values.
     *
     * @return list<array{group: string, label: string, description: string, icon: string, values: array<string, mixed>}>
     */
    public function __invoke(): array
    {
        $out = [];

        foreach ($this->registry->all() as $group => $definition) {
            $out[] = [
                'group' => $group,
                'label' => $definition->label,
                'description' => $definition->description,
                'icon' => $definition->icon,
                'values' => $this->settings->getGroup($group),
            ];
        }

        return $out;
    }
}
