<?php

declare(strict_types=1);

namespace Stackra\SharedAttributesSdk;

use Stackra\ApiSdk\Attributes\AsSdkResource;
use Stackra\ApiSdk\Resources\BaseSdkResource;

/**
 * Top-level SDK Resource for the `attributes` module.
 *
 * Registered under `#[AsSdkResource(name: 'attributes', service: 'shared')]`
 * so the Shared service umbrella auto-discovers it at boot
 * and consumers dispatch every call via `$sdk->attributes()->...`.
 *
 * ## Peer Resources
 *
 * - AttributeDefinitionsResource — peer resource for `attribute-definitions`.
 * - AttributeGroupsResource — peer resource for `attribute-groups`.
 * - AttributeSetsResource — peer resource for `attribute-sets`.
 *
 * @category AttributesSdk
 *
 * @since    0.1.0
 */
#[AsSdkResource(name: 'attributes', service: 'shared')]
final class AttributesSdkResource extends BaseSdkResource
{
    private ?Resources\AttributeDefinitionsResource $attributeDefinitions = null;
    private ?Resources\AttributeGroupsResource $attributeGroups = null;
    private ?Resources\AttributeSetsResource $attributeSets = null;

    /**
     * Access AttributeDefinitions peer Resource.
     */
    public function attributeDefinitions(): Resources\AttributeDefinitionsResource
    {
        return $this->attributeDefinitions ??= new Resources\AttributeDefinitionsResource($this->connector);
    }

    /**
     * Access AttributeGroups peer Resource.
     */
    public function attributeGroups(): Resources\AttributeGroupsResource
    {
        return $this->attributeGroups ??= new Resources\AttributeGroupsResource($this->connector);
    }

    /**
     * Access AttributeSets peer Resource.
     */
    public function attributeSets(): Resources\AttributeSetsResource
    {
        return $this->attributeSets ??= new Resources\AttributeSetsResource($this->connector);
    }
}
