<?php

/**
 * @file packages/sdk/api-sdk/src/Attributes/SdkResponse.php
 *
 * @description
 * Server-side marker declaring "this Data class is the wire-visible
 * response shape for endpoint X". Read by the SDK generator
 * ({@see \Stackra\SdkGenerator\Discovery\SdkAttributeScanner})
 * during `php artisan sdk:generate <service>` to emit the matching
 * SDK `Data/<Entity>Data.php` file in the target sub-package.
 *
 * ## Wiring flow
 *
 *   1. A server-side action's response Data class carries
 *      `#[SdkResponse(service: 'platform', resource: 'workspaces')]`.
 *
 *   2. `SdkGenerateCommand` invokes the scanner, which collects
 *      every `#[SdkResponse]` hit via
 *      `olvlvl/composer-attribute-collector`.
 *
 *   3. `DataEmitter` groups hits by `(service, resource)`, then
 *      emits one `Data/<Entity>Data.php` per class into
 *      `packages/sdk/<service>-<resource>-sdk/src/Data/`.
 *
 * ## Repeatable — why
 *
 * A single Data class MAY back both the "central" and "workspace"
 * audiences of the same aggregate; carrying `#[SdkResponse]` twice
 * — once per audience — lets the generator emit the class into
 * BOTH sub-packages while keeping the source-of-truth DRY on the
 * server side.
 */

declare(strict_types=1);

namespace Stackra\ApiSdk\Attributes;

use Attribute;

/**
 * Server-side marker for a Data class exposed as an SDK response.
 *
 * ## Purpose
 *
 * Declares the wire-visible response shape of an endpoint so the
 * SDK generator can emit a matching `Data/<Entity>Data.php` file
 * into the correct `<service>-<module>-sdk` sub-package.
 *
 * ## Example
 *
 * ```php
 * // On the SERVER side (e.g. apps/platform-service/src/modules/workspaces/):
 *
 * use Stackra\ApiSdk\Attributes\SdkResponse;
 * use Spatie\LaravelData\Data;
 *
 * #[SdkResponse(service: 'platform', resource: 'workspaces')]
 * final class WorkspaceData extends Data
 * {
 *     public function __construct(
 *         public string $id,
 *         public string $slug,
 *         // ...
 *     ) {}
 * }
 * ```
 *
 * ## Generator behaviour
 *
 * `DataEmitter` reads every `#[SdkResponse]` hit, groups by
 * `(service, resource)`, and emits one `Data/<Entity>Data.php`
 * per hit — stripping every server-side-only property (marked
 * with `#[SdkOmit]`) and applying `#[MapInputName(SnakeCaseMapper::class)]`
 * so the emitted DTO bridges snake_case wire ↔ camelCase PHP.
 * The emitted file's class name is the source class name verbatim
 * (typically `<Entity>Data`); the emitter never renames.
 *
 * @category ApiSdk
 *
 * @since    0.2.0
 */
#[Attribute(Attribute::TARGET_CLASS | Attribute::IS_REPEATABLE)]
final readonly class SdkResponse
{
    /**
     * @param  string       $service         The platform service this
     *                                       DTO belongs to — must match the
     *                                       `<service>-*-sdk` sub-package name.
     *                                       Examples: `platform`, `identity`,
     *                                       `billing`.
     * @param  string       $resource        The module inside the service
     *                                       (`workspaces`, `domains`, `billing`).
     *                                       Combined with `$service` to
     *                                       produce the sub-package name:
     *                                       `<service>-<resource>-sdk`.
     * @param  string|null  $paginationOf    When this DTO wraps a
     *                                       paginated list, the FQCN of
     *                                       the item Data class. Signals
     *                                       the emitter to generate a
     *                                       `PaginatedResponse<TItem>`
     *                                       return type rather than a
     *                                       bare Data DTO.
     * @param  bool         $envelopeUnwrap  When `true` (the default),
     *                                       the emitted Request's
     *                                       `createDtoFromResponse()`
     *                                       unwraps `payload['data']`
     *                                       before hydration. Set to
     *                                       `false` for endpoints that
     *                                       skip the envelope (e.g. RPC
     *                                       shapes).
     */
    public function __construct(
        public string $service,
        public string $resource,
        public ?string $paginationOf = null,
        public bool $envelopeUnwrap = true,
    ) {
    }
}
