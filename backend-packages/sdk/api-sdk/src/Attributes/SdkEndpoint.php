<?php

/**
 * @file packages/sdk/api-sdk/src/Attributes/SdkEndpoint.php
 *
 * @description
 * Server-side marker declaring "this action class exposes an SDK
 * endpoint". Combined with the action's routing attributes
 * (`#[Get|Post|Patch|Delete|Put]`) this becomes the whole
 * contract the SDK generator needs to emit a matching Saloon
 * Request under `Requests/<Aggregate>/<Op><Aggregate>Request.php`.
 *
 * ## Wiring flow
 *
 *   1. A server-side action carries `#[Post('/api/v1/workspaces')]`
 *      AND `#[SdkEndpoint(service: 'platform', resource: 'workspaces', name: 'create')]`.
 *
 *   2. `SdkGenerateCommand` invokes the scanner, which reads both
 *      attributes: the routing attribute contributes verb + path,
 *      `#[SdkEndpoint]` contributes SDK routing metadata (which
 *      sub-package, which aggregate, which method name on the
 *      generated peer Resource).
 *
 *   3. `RequestEmitter` emits `Requests/<Aggregate>/<Op><Aggregate>Request.php`.
 *      `ResourceEmitter` accumulates one method per endpoint on
 *      the generated peer `<Aggregate>Resource.php`.
 *
 * ## Idempotency — auto vs explicit
 *
 * `Idempotency-Key` support on the emitted Request follows this
 * rule matrix, in order:
 *
 *   1. `$idempotent === true` explicitly → emit with support.
 *   2. `$idempotent === false` explicitly → emit without support.
 *   3. `$idempotent === null` (default) → auto-detect from the
 *      HTTP verb on the sibling routing attribute:
 *      - `GET` → no support (idempotent reads don't need it).
 *      - `POST` → emit with support (POST is the classic replay
 *        target).
 *      - `PATCH` / `PUT` / `DELETE` → emit with support
 *        (partial updates + deletes benefit from replay safety).
 */

declare(strict_types=1);

namespace Academorix\ApiSdk\Attributes;

use Attribute;
use InvalidArgumentException;

/**
 * Server-side marker exposing an action as an SDK endpoint.
 *
 * ## Purpose
 *
 * Declares that the annotated action should surface on the SDK,
 * naming the sub-package (`<service>-<resource>-sdk`), the
 * aggregate the endpoint belongs to (via `$resource`), the
 * public method name on the generated peer Resource
 * (via `$name`), and the audience gating class the generator
 * uses to place the endpoint on the correct peer Resource.
 *
 * ## Example
 *
 * ```php
 * // On the SERVER side:
 *
 * use Academorix\ApiSdk\Attributes\SdkEndpoint;
 * use Academorix\Routing\Attributes\Post;
 * use Academorix\Routing\Attributes\AsController;
 * use Illuminate\Routing\Controllers\HasMiddleware;
 *
 * #[AsController]
 * #[Post('/api/v1/workspaces')]
 * #[SdkEndpoint(
 *     service:  'platform',
 *     resource: 'workspaces',
 *     name:     'create',
 *     audience: 'platform-admin',
 * )]
 * final class CreateWorkspaceAction extends Controller
 * {
 *     public function __invoke(CreateWorkspaceData $data): WorkspaceData
 *     {
 *         // ...
 *     }
 * }
 * ```
 *
 * ## Generator behaviour
 *
 * `RequestEmitter` reads every `#[SdkEndpoint]` hit and emits:
 *
 *   - `Requests/<PascalResource>/<Op><PascalResource>Request.php` —
 *     the concrete Saloon Request. Verb + path pulled from the
 *     sibling routing attribute; response DTO type pulled from
 *     the action's return type (or the explicit `$responseDto`
 *     when set); idempotency support decided by the rule matrix
 *     described in the file docblock above.
 *
 *   - One accessor method on the peer `Resources/<PascalResource>Resource.php`
 *     (or `<PascalResource>AdminResource` when `$audience` is
 *     `platform-admin`, or `<PascalResource>CentralResource` when
 *     `$audience` is `central`). The method name comes from
 *     `$name`.
 *
 * @category ApiSdk
 *
 * @since    0.2.0
 */
#[Attribute(Attribute::TARGET_CLASS)]
final readonly class SdkEndpoint
{
    /**
     * Legal `$audience` values — decides which peer Resource
     * receives the emitted method.
     *
     * @var list<string>
     */
    public const array AUDIENCES = ['central', 'platform-admin', 'workspace'];

    /**
     * @param  string       $service      The platform service —
     *                                    must match the
     *                                    `<service>-*-sdk` package name.
     * @param  string       $resource     The module inside the service
     *                                    (`workspaces`, `domains`,
     *                                    `billing`).
     * @param  string       $name         The public method name on the
     *                                    generated peer Resource
     *                                    (`list`, `show`, `create`,
     *                                    `update`, `delete`, `verify`,
     *                                    ...). Convention: domain-
     *                                    oriented, never HTTP-verb-
     *                                    oriented (no `getShow` /
     *                                    `postCreate`).
     * @param  string       $audience     One of {@see self::AUDIENCES}.
     *                                    Decides which peer Resource
     *                                    receives the method — enables
     *                                    the split between public
     *                                    (`WorkspacesResource`) and
     *                                    admin (`WorkspacesAdminResource`)
     *                                    surfaces.
     * @param  string|null  $responseDto  FQCN of the response Data
     *                                    class. Optional — when null,
     *                                    the emitter infers from the
     *                                    action's `__invoke()` return
     *                                    type. Explicit values wins
     *                                    over inference so callers can
     *                                    downgrade a broad return to a
     *                                    narrower wire shape.
     * @param  bool|null    $idempotent   Idempotency-Key support toggle.
     *                                    See the rule matrix in the
     *                                    file docblock. `null` = auto,
     *                                    `true` = force on,
     *                                    `false` = force off.
     * @param  string|null  $payloadDto   FQCN of the request-body
     *                                    Data class. Optional — when
     *                                    null, the emitter infers from
     *                                    the action's `__invoke()`
     *                                    parameter that carries
     *                                    `#[SdkPayload]`.
     *
     * @throws InvalidArgumentException  When `$audience` is not one of
     *                                   {@see self::AUDIENCES}.
     */
    public function __construct(
        public string $service,
        public string $resource,
        public string $name,
        public string $audience = 'workspace',
        public ?string $responseDto = null,
        public ?bool $idempotent = null,
        public ?string $payloadDto = null,
    ) {
        // Reject unknown audiences — the generator can't dispatch
        // to a peer Resource whose shape it hasn't been taught.
        if (! in_array($audience, self::AUDIENCES, true)) {
            throw new InvalidArgumentException(
                sprintf(
                    'SdkEndpoint::audience must be one of [%s], got "%s".',
                    implode(', ', self::AUDIENCES),
                    $audience,
                ),
            );
        }
    }
}
