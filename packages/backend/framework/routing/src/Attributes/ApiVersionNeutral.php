<?php

/**
 * @file packages/routing/src/Attributes/ApiVersionNeutral.php
 *
 * @description
 * Marker attribute: this controller class or method is intentionally
 * VERSION-AGNOSTIC. The version detector will not reject requests
 * to it, and the response emitter will not add
 * `X-API-Version` / `X-API-Deprecated` / `Sunset` headers.
 *
 * ## When to use
 *
 *   - Health / liveness / readiness endpoints served by
 *     operations tooling that has no notion of API version.
 *   - Discovery endpoints (`/api/versions`, `/.well-known/*`)
 *     that describe available versions and must remain reachable
 *     from every version negotiation.
 *   - Static well-known documents (`/robots.txt`, `/openapi.json`)
 *     if they're routed through this package.
 *
 * ## Interaction with #[ApiVersion]
 *
 * A class marked `#[ApiVersionNeutral]` should not also carry
 * `#[ApiVersion]` — the intent is contradictory. The version
 * detector treats `ApiVersionNeutral` as a hard override and
 * ignores any co-located `#[ApiVersion]` on the same target, but
 * a linter rule / phpstan check will flag the combination.
 *
 * ## Attribute target
 *
 * Both `TARGET_CLASS` and `TARGET_METHOD`. Neutrality applies at
 * whichever level it is placed:
 *
 *   - CLASS: every action on the controller is neutral.
 *   - METHOD: only this action is neutral; siblings still follow
 *     the class-level `#[ApiVersion]` (if any).
 *
 * ## Usage
 *
 * ```php
 * #[ApiVersionNeutral]
 * class HealthController extends BaseController
 * {
 *     #[Get('/api/health')]
 *     public function healthz() { }
 * }
 *
 * // Method-level neutrality on an otherwise-versioned controller:
 * #[ApiVersion(['v1', 'v2'])]
 * class DiagnosticsController extends BaseController
 * {
 *     #[Get('/api/v{version}/diagnostics')]
 *     public function full() { }
 *
 *     #[Get('/api/diagnostics/ping')]
 *     #[ApiVersionNeutral]
 *     public function ping() { }
 * }
 * ```
 *
 * @see ApiVersion Class-level version allowlist.
 * @see MapToApiVersion Method-level narrowing.
 */

declare(strict_types=1);

namespace Academorix\Routing\Attributes;

use Attribute;

/**
 * Marker attribute — carries no payload.
 *
 * The presence of the attribute is the signal; the detector's only
 * question is "is this class or method decorated with it?". Not
 * repeatable — one marker is enough.
 *
 * @final
 */
#[Attribute(Attribute::TARGET_CLASS | Attribute::TARGET_METHOD)]
final class ApiVersionNeutral
{
    public function __construct()
    {
        // Intentionally empty — marker attribute.
    }
}
