<?php

declare(strict_types=1);

namespace Academorix\Settings\Actions;

use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Academorix\Settings\Contracts\SettingsServiceInterface;
use InvalidArgumentException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * `GET /api/v1/settings/{group}` — resolved values for one
 * settings group.
 *
 * The scope substrate applies the hierarchy cascade based on the
 * active scope context (established by the `scope` middleware
 * per `.kiro/steering/scope.md` §1). Unknown groups return `404`
 * for a clean HTTP shape.
 *
 * @category Settings
 *
 * @since    0.1.0
 */
#[AsAction(name: 'settings.show')]
#[Get(
    uri: '/api/v1/settings/{group}',
    name: 'settings.show',
    summary: 'Resolved values for one settings group.',
    tags: ['Settings'],
    parameters: [
        ['name' => 'group', 'in' => 'path', 'type' => 'string', 'required' => true],
    ],
    responseType: 'object',
    responseCode: 200,
)]
#[Middleware(['api', 'tenant', 'auth:sanctum'])]
final class ShowSettingsGroup
{
    use AsController;

    /**
     * @param  SettingsServiceInterface  $settings  Settings service.
     */
    public function __construct(
        private readonly SettingsServiceInterface $settings,
    ) {}

    /**
     * Resolve the group's values.
     *
     * @param  string  $group  Group key from the URI.
     * @return array<string, mixed>
     *
     * @throws NotFoundHttpException When the group is unknown.
     */
    public function __invoke(string $group): array
    {
        try {
            return $this->settings->getGroup($group);
        } catch (InvalidArgumentException $e) {
            throw new NotFoundHttpException($e->getMessage(), $e);
        }
    }
}
