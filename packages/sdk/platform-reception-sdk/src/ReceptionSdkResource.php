<?php

declare(strict_types=1);

namespace Academorix\PlatformReceptionSdk;

use Academorix\ApiSdk\Attributes\AsSdkResource;
use Academorix\ApiSdk\Resources\BaseSdkResource;

/**
 * Top-level SDK Resource for the `reception` module.
 *
 * Registered under `#[AsSdkResource(name: 'reception', service: 'platform')]`
 * so the Platform service umbrella auto-discovers it at boot
 * and consumers dispatch every call via `$sdk->reception()->...`.
 *
 * ## Peer Resources
 *
 * - ReceptionVisitsResource — peer resource for `reception-visits`.
 *
 * @category ReceptionSdk
 *
 * @since    0.1.0
 */
#[AsSdkResource(name: 'reception', service: 'platform')]
final class ReceptionSdkResource extends BaseSdkResource
{
    private ?Resources\ReceptionVisitsResource $receptionVisits = null;

    /**
     * Access ReceptionVisits peer Resource.
     */
    public function receptionVisits(): Resources\ReceptionVisitsResource
    {
        return $this->receptionVisits ??= new Resources\ReceptionVisitsResource($this->connector);
    }
}
