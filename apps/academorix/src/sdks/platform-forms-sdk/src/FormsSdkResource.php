<?php

declare(strict_types=1);

namespace Stackra\PlatformFormsSdk;

use Stackra\ApiSdk\Attributes\AsSdkResource;
use Stackra\ApiSdk\Resources\BaseSdkResource;

/**
 * Top-level SDK Resource for the `forms` module.
 *
 * Registered under `#[AsSdkResource(name: 'forms', service: 'platform')]`
 * so the Platform service umbrella auto-discovers it at boot
 * and consumers dispatch every call via `$sdk->forms()->...`.
 *
 * ## Peer Resources
 *
 * - FormSubmissionsResource — peer resource for `form-submissions`.
 * - FormVersionsResource — peer resource for `form-versions`.
 * - FormsResource — peer resource for `forms`.
 *
 * @category FormsSdk
 *
 * @since    0.1.0
 */
#[AsSdkResource(name: 'forms', service: 'platform')]
final class FormsSdkResource extends BaseSdkResource
{
    private ?Resources\FormSubmissionsResource $formSubmissions = null;
    private ?Resources\FormVersionsResource $formVersions = null;
    private ?Resources\FormsResource $forms = null;

    /**
     * Access FormSubmissions peer Resource.
     */
    public function formSubmissions(): Resources\FormSubmissionsResource
    {
        return $this->formSubmissions ??= new Resources\FormSubmissionsResource($this->connector);
    }

    /**
     * Access FormVersions peer Resource.
     */
    public function formVersions(): Resources\FormVersionsResource
    {
        return $this->formVersions ??= new Resources\FormVersionsResource($this->connector);
    }

    /**
     * Access Forms peer Resource.
     */
    public function forms(): Resources\FormsResource
    {
        return $this->forms ??= new Resources\FormsResource($this->connector);
    }
}
