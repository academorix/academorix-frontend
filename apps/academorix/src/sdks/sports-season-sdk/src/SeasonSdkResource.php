<?php

declare(strict_types=1);

namespace Stackra\SportsSeasonSdk;

use Stackra\ApiSdk\Attributes\AsSdkResource;
use Stackra\ApiSdk\Resources\BaseSdkResource;

/**
 * Top-level SDK Resource for the `season` module.
 *
 * Registered under `#[AsSdkResource(name: 'season', service: 'sports')]`
 * so the Sports service umbrella auto-discovers it at boot
 * and consumers dispatch every call via `$sdk->season()->...`.
 *
 * ## Peer Resources
 *
 * - SeasonsResource — peer resource for `seasons`.
 *
 * @category SeasonSdk
 *
 * @since    0.1.0
 */
#[AsSdkResource(name: 'season', service: 'sports')]
final class SeasonSdkResource extends BaseSdkResource
{
    private ?Resources\SeasonsResource $seasons = null;

    /**
     * Access Seasons peer Resource.
     */
    public function seasons(): Resources\SeasonsResource
    {
        return $this->seasons ??= new Resources\SeasonsResource($this->connector);
    }
}
