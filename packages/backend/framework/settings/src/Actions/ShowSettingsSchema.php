<?php

declare(strict_types=1);

namespace Stackra\Settings\Actions;

use Stackra\Settings\Contracts\SettingsServiceInterface;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;

/**
 * `GET /api/v1/settings/schema` — full settings schema for the
 * admin UI.
 *
 * Returns every registered group with its resolved field +
 * visual-group metadata. Consumers render this into their own
 * form controls; the payload is HeroUI-agnostic (`controlType`
 * is a semantic name, not a HeroUI class) per
 * `.kiro/steering/settings.md` §6.
 *
 * The outer HTTP layer is responsible for filtering by the
 * caller's permission grants; the service returns the whole
 * schema unless an explicit `permission` string is passed.
 *
 * @category Settings
 *
 * @since    0.1.0
 */
#[AsAction(name: 'settings.schema')]
#[Get(
    uri: '/api/v1/settings/schema',
    name: 'settings.schema',
    summary: 'Full settings schema for admin UI rendering.',
    tags: ['Settings'],
    responseType: 'array',
    responseCode: 200,
)]
#[Middleware(['api', 'tenant', 'auth:sanctum'])]
final class ShowSettingsSchema
{
    use AsController;

    /**
     * @param  SettingsServiceInterface  $settings  The settings service.
     */
    public function __construct(
        private readonly SettingsServiceInterface $settings,
    ) {}

    /**
     * Return the full schema.
     *
     * @return list<array<string, mixed>>
     */
    public function __invoke(): array
    {
        return $this->settings->getSchema();
    }
}
