<?php

declare(strict_types=1);

namespace Stackra\FinanceDigitalPassesSdk;

use Stackra\ApiSdk\Attributes\AsSdkResource;
use Stackra\ApiSdk\Resources\BaseSdkResource;

/**
 * Top-level SDK Resource for the `digital-passes` module.
 *
 * Registered under `#[AsSdkResource(name: 'digital-passes', service: 'finance')]`
 * so the Finance service umbrella auto-discovers it at boot
 * and consumers dispatch every call via `$sdk->digitalPasses()->...`.
 *
 * ## Peer Resources
 *
 * - WalletPassesResource — peer resource for `wallet-passes`.
 *
 * @category DigitalPassesSdk
 *
 * @since    0.1.0
 */
#[AsSdkResource(name: 'digital-passes', service: 'finance')]
final class DigitalPassesSdkResource extends BaseSdkResource
{
    private ?Resources\WalletPassesResource $walletPasses = null;

    /**
     * Access WalletPasses peer Resource.
     */
    public function walletPasses(): Resources\WalletPassesResource
    {
        return $this->walletPasses ??= new Resources\WalletPassesResource($this->connector);
    }
}
