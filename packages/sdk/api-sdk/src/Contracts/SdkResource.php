<?php

/**
 * @file packages/sdk/api-sdk/src/Contracts/SdkResource.php
 *
 * @description
 * Base contract every module-supplied SDK resource implements.
 * The registry stores resources keyed by `name()`; the ApiClient
 * facade dispatches `__call('tenancy', [])` to the matching
 * resource.
 *
 * Resources encapsulate the requests + response mapping for one
 * bounded context (Tenancy, Access, AI, …). They do NOT hold
 * per-call state — the connector is wired once at discovery time
 * and reused for every method invocation.
 *
 * ## Minimum surface
 *
 * Two methods:
 *
 *   - {@see name()} — public dispatch key, mirrors
 *     `#[AsSdkResource]::$name`. Kept on the instance so
 *     resources can also be constructed manually (in tests).
 *
 *   - {@see attachConnector()} — one-time wiring hook. The
 *     provider calls this once during boot; the resource stores
 *     the connector on a property so its requests can be sent.
 *
 * Concrete resources add semantic methods (`find()`, `list()`,
 * `create()`, etc.) that build {@see \Saloon\Http\Request}
 * instances and dispatch them through the stored connector.
 *
 * ## Why not just extend `Saloon\Http\BaseResource`?
 *
 * Saloon's `BaseResource` is a fine parent class — and every
 * concrete resource DOES extend it — but the base class ties
 * the resource to Saloon internals. This contract stays framework-
 * agnostic so a future non-Saloon transport (gRPC, JSON-RPC) can
 * ship resources without a Saloon dependency.
 *
 * @see \Stackra\ApiSdk\Resources\BaseSdkResource Default implementation.
 */

declare(strict_types=1);

namespace Stackra\ApiSdk\Contracts;

use Stackra\ApiSdk\Client\ApiConnector;

interface SdkResource
{
    /**
     * The dispatch key consumers use through the facade:
     * `$api->{$this->name()}()`.
     */
    public function name(): string;

    /**
     * One-time wiring hook. Called by the discovery pass with
     * the shared connector so the resource's requests can be
     * dispatched. Calling twice MUST be safe (idempotent).
     */
    public function attachConnector(ApiConnector $connector): void;
}
