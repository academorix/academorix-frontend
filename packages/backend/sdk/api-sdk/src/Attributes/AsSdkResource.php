<?php

/**
 * @file packages/sdk/api-sdk/src/Attributes/AsSdkResource.php
 *
 * @description
 * Discovery marker for every {@see \Stackra\ApiSdk\Contracts\SdkResource}
 * implementation. Every module's SDK sibling ships one resource
 * class that carries this attribute. The `ApiSdkServiceProvider`
 * walks `olvlvl/composer-attribute-collector` at boot, resolves
 * each target out of the container, wires the connector into it,
 * and stores it in {@see \Stackra\ApiSdk\Registry\SdkResourceRegistry}
 * keyed by `$name`.
 *
 * ## Discovery flow
 *
 *   1. Module SDK ships `TenancySdkResource` with
 *      `#[AsSdkResource(name: 'tenancy')]` and extends
 *      {@see \Stackra\ApiSdk\Resources\BaseSdkResource}.
 *
 *   2. Provider's `boot()` runs discovery:
 *      ```
 *      foreach (Attributes::findTargetClasses(AsSdkResource::class) as $target) {
 *          $resource = $container->make($target->name);
 *          $resource->attachConnector($this->connector);
 *          $registry->register($target->attribute->name, $resource);
 *      }
 *      ```
 *
 *   3. Consumer calls `$api->tenancy()` — `ApiClient::__call()`
 *      looks the resource up in the registry.
 *
 * ## Why not a hard-coded `$resources` map on the client
 *
 * Every alternative I considered had the ApiClient know the
 * concrete resource class names, which means adding a new
 * module = editing this package. Attribute discovery keeps this
 * package closed for modification and open for extension.
 *
 * ## Priority
 *
 * `priority` controls initialisation order — lower runs first.
 * Convention:
 *
 *   -   0..49  — structural / cross-cutting (auth, tenancy).
 *   -  50..149 — normal domain resources.
 *   - 150..∞   — experimental / low-priority.
 *
 * The default (100) suits every typical resource.
 *
 * @see \Stackra\ApiSdk\Contracts\SdkResource Contract implementers satisfy.
 * @see \Stackra\ApiSdk\Registry\SdkResourceRegistry Discovery target.
 */

declare(strict_types=1);

namespace Stackra\ApiSdk\Attributes;

use Attribute;

/**
 * Marker attribute for module-supplied SDK resource classes.
 *
 * Applied on the resource class itself (never on requests or
 * DTOs — those are stateless payload types and don't need
 * discovery).
 */
#[Attribute(Attribute::TARGET_CLASS)]
final readonly class AsSdkResource
{
    /**
     * @param  string  $name
     *   The public name consumers use in `$api->{$name}()`. Kebab
     *   or lowercase-snake; MUST be a legal PHP identifier
     *   segment because it's exposed via `__call()`. Convention:
     *   the module's lowercase name (`tenancy`, `access`, `ai`).
     *
     * @param  int  $priority
     *   Lower runs first during the discovery pass. See the
     *   docblock for the ordering convention.
     *
     * @param  bool  $enabled
     *   When `false`, the resource is skipped at discovery time.
     *   Useful for feature-flagging an in-progress module without
     *   deleting the class.
     *
     * @param  string|null  $service
     *   The platform service this resource belongs to (`identity`,
     *   `platform`, `billing`, ...). Each per-service SDK umbrella
     *   scopes its discovery pass to resources whose `service`
     *   matches its own, so one connector (one base URL) is only
     *   ever attached to that service's resources. `null` = the
     *   legacy `apps/api` monolith surface.
     */
    public function __construct(
        public string $name,
        public int $priority = 100,
        public bool $enabled = true,
        public ?string $service = null,
    ) {
    }
}
