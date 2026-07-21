<?php

declare(strict_types=1);

namespace Stackra\SportsFormationsSdk;

use Stackra\ApiSdk\Attributes\AsSdkResource;
use Stackra\ApiSdk\Resources\BaseSdkResource;

/**
 * Top-level SDK Resource for the `formations` module.
 *
 * Registered under `#[AsSdkResource(name: 'formations', service: 'sports')]`
 * so the Sports service umbrella auto-discovers it at boot
 * and consumers dispatch every call via `$sdk->formations()->...`.
 *
 * ## Peer Resources
 *
 * - FormationSlotsResource — peer resource for `formation-slots`.
 * - FormationsResource — peer resource for `formations`.
 *
 * @category FormationsSdk
 *
 * @since    0.1.0
 */
#[AsSdkResource(name: 'formations', service: 'sports')]
final class FormationsSdkResource extends BaseSdkResource
{
    private ?Resources\FormationSlotsResource $formationSlots = null;
    private ?Resources\FormationsResource $formations = null;

    /**
     * Access FormationSlots peer Resource.
     */
    public function formationSlots(): Resources\FormationSlotsResource
    {
        return $this->formationSlots ??= new Resources\FormationSlotsResource($this->connector);
    }

    /**
     * Access Formations peer Resource.
     */
    public function formations(): Resources\FormationsResource
    {
        return $this->formations ??= new Resources\FormationsResource($this->connector);
    }
}
