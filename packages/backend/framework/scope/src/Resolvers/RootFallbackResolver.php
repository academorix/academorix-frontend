<?php

/**
 * @file src/Resolvers/RootFallbackResolver.php
 *
 * @description
 * Priority 0. Last resort — when every other resolver defers, this
 * one tries to establish the authenticated user's tenant root
 * node. Refuses to fabricate an owner id: if no user is
 * authenticated, returns `null` and the middleware fails closed
 * per `scope.middleware.strict`.
 *
 * The owner-id lookup is deliberately loose: the resolver checks
 * for common patterns (`tenant_id` on the user, an `ownerId()`
 * method) but never assumes a specific schema. Deployments with a
 * different owner-identity shape publish their own resolver.
 */

declare(strict_types=1);

namespace Academorix\Scope\Resolvers;

use Academorix\Scope\Attributes\AsScopeResolver;
use Academorix\Scope\Contracts\ScopeResolverInterface;
use Academorix\Scope\Data\ScopeContextData;
use Academorix\Scope\Enums\ScopeResolverPriority;
use Academorix\Scope\Models\ScopeNode;
use Illuminate\Http\Request;

/**
 * Root fallback resolver.
 *
 * ## Owner-id extraction — order of attempts
 *
 *   1. `$user->ownerId()` — canonical hook when the user model
 *      opts in.
 *   2. `$user->tenant_id` attribute — the most common shape in
 *      this codebase.
 *   3. `$user->owner_id` attribute — some deployments name it
 *      differently.
 *   4. Give up (return `null`).
 *
 * The resolver stops at the first non-null match.
 */
#[AsScopeResolver(priority: ScopeResolverPriority::RootFallback->value)]
final class RootFallbackResolver implements ScopeResolverInterface
{
    public function name(): string
    {
        return 'root_fallback';
    }

    public function priority(): int
    {
        return ScopeResolverPriority::RootFallback->value;
    }

    public function resolve(Request $request): ?ScopeContextData
    {
        $user = $request->user();
        if ($user === null) {
            return null;
        }

        $ownerId = $this->extractOwnerId($user);
        if ($ownerId === null) {
            return null;
        }

        // Look up the owner's root node — the one with `parent_node_id
        // IS NULL` for that owner. Owners without a bootstrapped
        // scope tree fall through to `null`, which the middleware
        // handles per `scope.middleware.strict`.
        /** @var ScopeNode|null $root */
        $root = ScopeNode::query()
            ->where(ScopeNode::ATTR_OWNER_ID, $ownerId)
            ->whereNull(ScopeNode::ATTR_PARENT_NODE_ID)
            ->first();

        if ($root === null) {
            return null;
        }

        return ScopeContextData::fromNode($root);
    }

    /**
     * Try each known user-owner shape.
     */
    private function extractOwnerId(object $user): ?string
    {
        if (method_exists($user, 'ownerId')) {
            $value = $user->ownerId();

            return is_string($value) && $value !== '' ? $value : null;
        }

        foreach (['tenant_id', 'owner_id'] as $attribute) {
            $value = $user->{$attribute} ?? null;
            if (is_string($value) && $value !== '') {
                return $value;
            }
        }

        return null;
    }
}
