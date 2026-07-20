<?php

declare(strict_types=1);

namespace Academorix\PlatformPublicSiteSdk;

use Academorix\ApiSdk\Attributes\AsSdkResource;
use Academorix\ApiSdk\Resources\BaseSdkResource;

/**
 * Top-level SDK Resource for the `public-site` module.
 *
 * Registered under `#[AsSdkResource(name: 'public-site', service: 'platform')]`
 * so the Platform service umbrella auto-discovers it at boot
 * and consumers dispatch every call via `$sdk->publicSite()->...`.
 *
 * ## Peer Resources
 *
 * - ContentBlocksResource — peer resource for `content-blocks`.
 * - PublicPagesResource — peer resource for `public-pages`.
 *
 * @category PublicSiteSdk
 *
 * @since    0.1.0
 */
#[AsSdkResource(name: 'public-site', service: 'platform')]
final class PublicSiteSdkResource extends BaseSdkResource
{
    private ?Resources\ContentBlocksResource $contentBlocks = null;
    private ?Resources\PublicPagesResource $publicPages = null;

    /**
     * Access ContentBlocks peer Resource.
     */
    public function contentBlocks(): Resources\ContentBlocksResource
    {
        return $this->contentBlocks ??= new Resources\ContentBlocksResource($this->connector);
    }

    /**
     * Access PublicPages peer Resource.
     */
    public function publicPages(): Resources\PublicPagesResource
    {
        return $this->publicPages ??= new Resources\PublicPagesResource($this->connector);
    }
}
