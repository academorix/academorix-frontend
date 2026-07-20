<?php

declare(strict_types=1);

namespace Academorix\FeatureFlagsSdk\Resources;

use Academorix\FeatureFlagsSdk\Connectors\FeatureFlagsConnector;
use Academorix\FeatureFlagsSdk\Data\FeatureKillSwitchData;
use Academorix\FeatureFlagsSdk\Data\FeatureOverrideData;
use Academorix\FeatureFlagsSdk\Data\FeatureRolloutData;
use Academorix\FeatureFlagsSdk\Saloon\KillSwitches\CreateKillSwitchRequest;
use Academorix\FeatureFlagsSdk\Saloon\KillSwitches\DeleteKillSwitchRequest;
use Academorix\FeatureFlagsSdk\Saloon\KillSwitches\ListKillSwitchesRequest;
use Academorix\FeatureFlagsSdk\Saloon\KillSwitches\UpdateKillSwitchRequest;
use Academorix\FeatureFlagsSdk\Saloon\Overrides\CreateOverrideRequest;
use Academorix\FeatureFlagsSdk\Saloon\Overrides\DeleteOverrideRequest;
use Academorix\FeatureFlagsSdk\Saloon\Overrides\ListOverridesRequest;
use Academorix\FeatureFlagsSdk\Saloon\Overrides\UpdateOverrideRequest;
use Academorix\FeatureFlagsSdk\Saloon\Rollouts\CreateRolloutRequest;
use Academorix\FeatureFlagsSdk\Saloon\Rollouts\DeleteRolloutRequest;
use Academorix\FeatureFlagsSdk\Saloon\Rollouts\ListRolloutsRequest;
use Academorix\FeatureFlagsSdk\Saloon\Rollouts\UpdateRolloutRequest;
use Saloon\Http\Response;

/**
 * SDK entry point — fluent facade over the FeatureFlags admin API.
 *
 * Callers instantiate this once with a connector and reach every
 * endpoint through named methods. Every method returns Saloon's
 * `Response` — callers cast to the appropriate Data class via
 * `Response::dtoOrFail()`.
 *
 * @category FeatureFlagsSdk
 *
 * @since    0.1.0
 */
final class FeatureFlagsResource
{
    /**
     * @param  FeatureFlagsConnector  $connector  Saloon connector.
     */
    public function __construct(
        private readonly FeatureFlagsConnector $connector,
    ) {}

    /**
     * List every kill switch.
     *
     * @return Response
     */
    public function listKillSwitches(): Response
    {
        return $this->connector->send(new ListKillSwitchesRequest());
    }

    /**
     * Create a kill switch.
     *
     * @param  FeatureKillSwitchData  $data  Wire DTO.
     * @return Response
     */
    public function createKillSwitch(FeatureKillSwitchData $data): Response
    {
        return $this->connector->send(new CreateKillSwitchRequest($data));
    }

    /**
     * Update a kill switch.
     *
     * @param  string                $id     Kill-switch id.
     * @param  array<string, mixed>  $patch  Patch payload.
     * @return Response
     */
    public function updateKillSwitch(string $id, array $patch): Response
    {
        return $this->connector->send(new UpdateKillSwitchRequest($id, $patch));
    }

    /**
     * Delete a kill switch.
     *
     * @param  string  $id  Kill-switch id.
     * @return Response
     */
    public function deleteKillSwitch(string $id): Response
    {
        return $this->connector->send(new DeleteKillSwitchRequest($id));
    }

    /**
     * List tenant overrides.
     *
     * @return Response
     */
    public function listOverrides(): Response
    {
        return $this->connector->send(new ListOverridesRequest());
    }

    /**
     * Create an override.
     *
     * @param  FeatureOverrideData  $data  Wire DTO.
     * @return Response
     */
    public function createOverride(FeatureOverrideData $data): Response
    {
        return $this->connector->send(new CreateOverrideRequest($data));
    }

    /**
     * Update an override.
     *
     * @param  string                $id     Override id.
     * @param  array<string, mixed>  $patch  Patch payload.
     * @return Response
     */
    public function updateOverride(string $id, array $patch): Response
    {
        return $this->connector->send(new UpdateOverrideRequest($id, $patch));
    }

    /**
     * Delete an override.
     *
     * @param  string  $id  Override id.
     * @return Response
     */
    public function deleteOverride(string $id): Response
    {
        return $this->connector->send(new DeleteOverrideRequest($id));
    }

    /**
     * List tenant rollouts.
     *
     * @return Response
     */
    public function listRollouts(): Response
    {
        return $this->connector->send(new ListRolloutsRequest());
    }

    /**
     * Create a rollout.
     *
     * @param  FeatureRolloutData  $data  Wire DTO.
     * @return Response
     */
    public function createRollout(FeatureRolloutData $data): Response
    {
        return $this->connector->send(new CreateRolloutRequest($data));
    }

    /**
     * Update a rollout.
     *
     * @param  string                $id     Rollout id.
     * @param  array<string, mixed>  $patch  Patch payload.
     * @return Response
     */
    public function updateRollout(string $id, array $patch): Response
    {
        return $this->connector->send(new UpdateRolloutRequest($id, $patch));
    }

    /**
     * Delete a rollout.
     *
     * @param  string  $id  Rollout id.
     * @return Response
     */
    public function deleteRollout(string $id): Response
    {
        return $this->connector->send(new DeleteRolloutRequest($id));
    }
}
