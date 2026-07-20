<?php

/**
 * @file src/Resolvers/HeaderScopeResolver.php
 *
 * @description
 * Priority 100. Reads a UUID from the configured request header
 * (default `X-Scope-Node-Id`) and, when present, hydrates the
 * matching `ScopeNode`. This is the explicit-override path — a
 * client that KNOWS which scope it wants sends the header and
 * every other resolver defers.
 */

declare(strict_types=1);

namespace Academorix\Scope\Resolvers;

use Academorix\Scope\Attributes\AsScopeResolver;
use Academorix\Scope\Contracts\ScopeResolverInterface;
use Academorix\Scope\Data\ScopeContextData;
use Academorix\Scope\Enums\ScopeResolverPriority;
use Academorix\Scope\Models\ScopeNode;
use Illuminate\Container\Attributes\Config;
use Illuminate\Http\Request;

/**
 * Explicit-override resolver.
 *
 * ## Security
 *
 * The header is a trusted UUID pointer, not a capability grant.
 * Auth/permissions decide whether the caller CAN see that scope;
 * the resolver just picks it. A caller supplying a foreign node's
 * UUID gets a context, but downstream authorisation checks reject
 * the request.
 *
 * ## Miss modes
 *
 *   * Header absent → `null` (defer to next resolver).
 *   * Header present but empty → `null`.
 *   * Header present but the node doesn't exist → `null`. The
 *     alternative — throwing — would make a stale bookmark cause
 *     a 500 instead of falling through to a valid default.
 */
#[AsScopeResolver(priority: ScopeResolverPriority::Header->value)]
final class HeaderScopeResolver implements ScopeResolverInterface
{
    /**
     * @param  string  $headerName  Injected via `#[Config]` — the
     *                              header the resolver reads the node UUID from. The
     *                              default matches Laravel's canonical header casing
     *                              rules; deployments behind reverse proxies that
     *                              strip custom headers may want to publish the config
     *                              and pick a different name.
     */
    public function __construct(
        #[Config('scope.header.name', 'X-Scope-Node-Id')]
        private readonly string $headerName = 'X-Scope-Node-Id',
    ) {}

    public function name(): string
    {
        return 'header';
    }

    public function priority(): int
    {
        return ScopeResolverPriority::Header->value;
    }

    public function resolve(Request $request): ?ScopeContextData
    {
        // `header()` returns `array|string|null` — for multi-valued
        // headers a proxy might emit an array; we accept only the
        // first value and coerce everything else to string. When
        // absent the coalesce hands us an empty string that the
        // trim + emptiness check drops.
        $raw = $request->header($this->headerName);
        if (\is_array($raw)) {
            $raw = $raw[0] ?? null;
        }
        $nodeId = trim((string) ($raw ?? ''));

        if ($nodeId === '') {
            return null;
        }

        /** @var ScopeNode|null $node */
        $node = ScopeNode::query()->find($nodeId);

        if ($node === null) {
            return null;
        }

        return ScopeContextData::fromNode($node);
    }
}
