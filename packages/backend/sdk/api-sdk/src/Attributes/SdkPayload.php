<?php

/**
 * @file packages/sdk/api-sdk/src/Attributes/SdkPayload.php
 *
 * @description
 * Server-side marker declaring "this Data class is the wire-visible
 * request-body shape for operation X on aggregate Y". Read by the
 * SDK generator during `php artisan sdk:generate <service>` to
 * emit the matching SDK `Payloads/<Aggregate>/<Op><Aggregate>Payload.php`
 * file in the target sub-package.
 *
 * ## Op semantics — what the emitter generates
 *
 *   * `create` — required fields on every property; validation
 *     attributes fire on construction.
 *   * `update` / `patch` — partial-update payload; every property
 *     is typed `T|Optional|null` with an `Optional` sentinel
 *     default so unmentioned fields never overwrite server state.
 *   * `delete` — rare; used when the delete endpoint accepts a
 *     body (soft-delete reason, cascade flag).
 *   * `custom` — the endpoint is neither of the above; the
 *     `customOp` argument names the operation for the emitted
 *     file (e.g. `custom = 'verify'` → `VerifyDomainPayload.php`).
 */

declare(strict_types=1);

namespace Stackra\ApiSdk\Attributes;

use Attribute;
use InvalidArgumentException;

/**
 * Server-side marker for a Data class exposed as an SDK request
 * body.
 *
 * ## Purpose
 *
 * Declares the wire-visible write-side shape of an endpoint so the
 * SDK generator can emit a matching `Payloads/<Aggregate>/<Op><Aggregate>Payload.php`
 * file into the correct `<service>-<module>-sdk` sub-package,
 * respecting the operation's create-vs-update semantics.
 *
 * ## Example
 *
 * ```php
 * // On the SERVER side:
 *
 * use Stackra\ApiSdk\Attributes\SdkPayload;
 * use Spatie\LaravelData\Data;
 *
 * #[SdkPayload(service: 'platform', resource: 'workspaces', op: 'create')]
 * final class CreateWorkspaceData extends Data
 * {
 *     public function __construct(
 *         #[Required, StringType, Max(63)]
 *         public string $slug,
 *         // ...
 *     ) {}
 * }
 * ```
 *
 * ## Generator behaviour
 *
 * `PayloadEmitter` reads every `#[SdkPayload]` hit and emits one
 * `<Op><Aggregate>Payload.php` per hit. The op decides the emitted
 * shape:
 *
 *   - `create` → concrete required properties + validation
 *     attributes as-is from source.
 *   - `update` / `patch` → every property rewritten as
 *     `T|Optional|null $prop = new Optional()` so unmentioned
 *     fields are stripped by Spatie's `toArray()` sentinel logic.
 *   - `delete` → concrete required properties for the delete body.
 *   - `custom` → emitted verbatim; the emitter uses `$customOp` to
 *     name the generated file (`<CustomOp><Aggregate>Payload.php`).
 *
 * @category ApiSdk
 *
 * @since    0.2.0
 */
#[Attribute(Attribute::TARGET_CLASS)]
final readonly class SdkPayload
{
    /**
     * Legal `$op` values. Anything outside this list throws on
     * construction — the SDK generator relies on the value being
     * one of these to choose an emitter branch.
     *
     * @var list<string>
     */
    public const array OPS = ['create', 'update', 'patch', 'delete', 'custom'];

    /**
     * @param  string       $service   The platform service this
     *                                 payload belongs to — must match
     *                                 the `<service>-*-sdk` sub-package.
     * @param  string       $resource  The module inside the service
     *                                 (`workspaces`, `domains`,
     *                                 `billing`).
     * @param  string       $op        The operation this payload
     *                                 backs. One of `create`,
     *                                 `update`, `patch`, `delete`,
     *                                 or `custom`. Drives the
     *                                 emitter's create-vs-partial
     *                                 branch.
     * @param  string|null  $customOp  Required when `$op === 'custom'`;
     *                                 names the operation for the
     *                                 emitted filename. Kebab-case
     *                                 (`verify-domain`) or camelCase
     *                                 (`verifyDomain`) both accepted
     *                                 — the emitter normalises.
     *
     * @throws InvalidArgumentException  When `$op` is not one of
     *                                   {@see self::OPS} OR when
     *                                   `$op === 'custom'` but
     *                                   `$customOp` is null / empty.
     */
    public function __construct(
        public string $service,
        public string $resource,
        public string $op,
        public ?string $customOp = null,
    ) {
        // Reject unknown ops early — the generator's emitter branch
        // matrix can't safely dispatch on a value it hasn't seen.
        if (! in_array($op, self::OPS, true)) {
            throw new InvalidArgumentException(
                sprintf(
                    'SdkPayload::op must be one of [%s], got "%s".',
                    implode(', ', self::OPS),
                    $op,
                ),
            );
        }

        // `custom` demands an explicit `customOp` so the emitter has
        // a name for the generated file. Every other op self-names
        // from `$op` itself.
        if ($op === 'custom' && ($customOp === null || $customOp === '')) {
            throw new InvalidArgumentException(
                'SdkPayload::customOp must be provided when op is "custom".',
            );
        }
    }
}
