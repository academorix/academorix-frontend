<?php

/**
 * @file packages/authorization/src/Middleware/AuthorizeControllerAction.php
 *
 * @description
 * The single HTTP middleware that enforces every `Require*` +
 * `AllowGuest` attribute on the resolved controller class +
 * action method.
 *
 * ## Where it runs
 *
 * Registered under the alias `authorize.action` via the
 * `#[AsMiddleware]` attribute below — discovered at boot by
 * {@see \Stackra\Routing\Providers\RoutingServiceProvider}, so
 * {@see \Stackra\Authorization\Providers\AuthorizationServiceProvider}
 * has no imperative alias wiring to carry.
 *
 * The consumer app pushes it onto the `api` middleware group in
 * `bootstrap/app.php` between `Authenticate` and
 * `SubstituteBindings` — meaning:
 *
 *   - `$request->user()` is populated when we run (auth already fired).
 *   - We fail 403 BEFORE route-model-binding hits the database
 *     for an under-permissioned request. No wasted query.
 *
 * ## What it enforces
 *
 * For each attribute family attached to the class + method:
 *
 *   - {@see \Stackra\Authorization\Attributes\RequirePermission}
 *     — user holds ALL listed permissions (AND).
 *   - {@see \Stackra\Authorization\Attributes\RequireAnyPermission}
 *     — user holds AT LEAST ONE listed permission (OR).
 *   - {@see \Stackra\Authorization\Attributes\RequireRole}
 *     — user holds ALL listed roles (AND).
 *   - {@see \Stackra\Authorization\Attributes\RequireAnyRole}
 *     — user holds AT LEAST ONE listed role (OR).
 *   - {@see \Stackra\Authorization\Attributes\AllowGuest}
 *     — short-circuits the "unauthenticated" check.
 *
 * Multiple attributes across different families combine with AND:
 * every family's check must pass.
 *
 * ## Class-level + method-level composition
 *
 * When a controller carries attributes on BOTH the class AND the
 * method, the middleware collects the union and enforces the
 * compound AND. This lets a controller establish a "must have
 * base permission" wall while individual actions layer additional
 * checks on top.
 *
 * ## Anonymous callers
 *
 * If the resolved controller carries ANY `Require*` attribute and
 * no user is authenticated:
 *
 *   - `#[AllowGuest]` present anywhere in scope → request passes.
 *   - Otherwise → {@see AuthenticationException} (401).
 *
 * Attribute-less controllers pass through untouched — the
 * middleware never touches public endpoints that don't opt into
 * any gate.
 *
 * ## Super-admin bypass
 *
 * Permission checks route through Laravel's Gate (via
 * `$user->can()`). The `Gate::before` super-admin hook (wired by
 * `packages/access`) grants every ability to any user with the
 * `super_admin` role.
 *
 * Role checks do NOT go through the Gate — `hasAllRoles()` and
 * `hasAnyRole()` consult spatie/laravel-permission directly.
 * This is deliberate: role checks are ground-truth; a
 * super-admin without the requested role remains denied.
 *
 * ## Per-worker attribute cache
 *
 * Reflection is cheap but not free. The middleware caches the
 * parsed attribute set per `Class::method` in a static array, so
 * subsequent requests in the same worker process pay only the
 * array-read cost. Octane-safe: the cache key includes both
 * class and method, so no cross-request state leaks between
 * distinct controller actions.
 *
 * ## Why this middleware is in the authorization package
 *
 * The middleware only depends on:
 *
 *   - PHP reflection (`ReflectionClass`, `ReflectionMethod`).
 *   - Laravel's Auth + Http contracts.
 *   - The 5 attribute classes in this package.
 *
 * It does NOT depend on spatie/laravel-permission's `Role` or
 * `Permission` models — those are runtime storage details behind
 * `$user->can()` and `$user->hasAllRoles()`. That keeps this
 * package cheap to install: every domain package can require it
 * without dragging permission tables in. The full role/permission
 * management surface (models, migrations, admin controllers)
 * lives in `packages/access`.
 */

declare(strict_types=1);

namespace Stackra\Authorization\Middleware;

use Stackra\Authorization\Attributes\AllowGuest;
use Stackra\Authorization\Attributes\RequireAnyPermission;
use Stackra\Authorization\Attributes\RequireAnyRole;
use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Authorization\Attributes\RequireRole;
use Stackra\Routing\Attributes\AsMiddleware;
use Closure;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Http\Request;
use Illuminate\Routing\Route;
use ReflectionClass;
use ReflectionMethod;

#[AsMiddleware(alias: 'authorize.action', groups: [], priority: 50)]
final class AuthorizeControllerAction
{
    /**
     * Per-worker cache of parsed attribute sets, keyed by
     * `Full\Controller\Class::method`.
     *
     * @var array<string, array{
     *     permissions_all: list<list<string>>,
     *     permissions_any: list<list<string>>,
     *     roles_all: list<list<string>>,
     *     roles_any: list<list<string>>,
     *     allow_guest: bool,
     * }>
     */
    // octane-safe: reflection-metadata cache keyed by class-string. Keys
    //              are immutable (FQCNs); values are deterministic
    //              (per-class attribute readouts). Safe across worker
    //              reuse — same key ALWAYS resolves to the same
    //              controller-attribute snapshot. Matches Laravel core's
    //              `Reflector::isCallable()` pattern.
    private static array $cache = [];

    /**
     * Handle an incoming request.
     *
     * @param Request $request The current HTTP request.
     * @param Closure $next The next pipeline stage.
     *
     * @return mixed The response from `$next` (or a downstream middleware).
     *
     * @throws AuthenticationException When the route needs auth and no user is present + no `#[AllowGuest]`.
     * @throws AuthorizationException When any attribute-level check fails.
     */
    public function handle(Request $request, Closure $next): mixed
    {
        $route = $request->route();

        // Non-controller routes (Closures, missing action) pass
        // through untouched — this middleware only reasons about
        // controller-mapped routes.
        if (! $route instanceof Route) {
            return $next($request);
        }

        $controllerInstance = $route->getController();
        $method = $route->getActionMethod();

        // `getController()` returns null for closure routes;
        // `getActionMethod()` returns the raw action string when
        // no controller is resolvable. Neither case interests us.
        if ($controllerInstance === null || $method === '' || $method === $route::class) {
            return $next($request);
        }

        $attributes = $this->attributesFor($controllerInstance::class, $method);

        // Short-circuit when the controller/method carries NONE
        // of the four `Require*` attributes. This is the common
        // case (many endpoints rely on the record-level policy
        // layer alone via CrudController's `#[UsePolicy]`).
        if ($this->isEmpty($attributes)) {
            return $next($request);
        }

        $user = $request->user();

        if ($user === null) {
            // Guest access is either explicitly allowed (#[AllowGuest])
            // or explicitly denied (attribute-carrying controller
            // with no #[AllowGuest] escape).
            if ($attributes['allow_guest']) {
                return $next($request);
            }

            throw new AuthenticationException(
                'Authentication required for this route.',
            );
        }

        // Authenticated caller — run every family. First failure
        // raises 403.
        $this->enforceAllPermissions($user, $attributes['permissions_all']);
        $this->enforceAnyPermissions($user, $attributes['permissions_any']);
        $this->enforceAllRoles($user, $attributes['roles_all']);
        $this->enforceAnyRoles($user, $attributes['roles_any']);

        return $next($request);
    }

    /**
     * Reflect on `$class::$method` and collect every attribute
     * family into a single struct.
     *
     * Cached per-worker keyed by `Class::method`.
     *
     * @return array{
     *     permissions_all: list<list<string>>,
     *     permissions_any: list<list<string>>,
     *     roles_all: list<list<string>>,
     *     roles_any: list<list<string>>,
     *     allow_guest: bool,
     * }
     */
    private function attributesFor(string $class, string $method): array
    {
        $cacheKey = $class . '::' . $method;

        if (isset(self::$cache[$cacheKey])) {
            return self::$cache[$cacheKey];
        }

        $reflectionClass = new ReflectionClass($class);

        $permAll = [];
        $permAny = [];
        $roleAll = [];
        $roleAny = [];
        $allowGuest = false;

        // Class-level attributes apply to every action on the
        // controller. Collect first so the compound check
        // enforces class + method-level together.
        foreach ($reflectionClass->getAttributes(RequirePermission::class) as $attr) {
            $permAll[] = $attr->newInstance()->permissions;
        }
        foreach ($reflectionClass->getAttributes(RequireAnyPermission::class) as $attr) {
            $permAny[] = $attr->newInstance()->permissions;
        }
        foreach ($reflectionClass->getAttributes(RequireRole::class) as $attr) {
            $roleAll[] = $attr->newInstance()->roles;
        }
        foreach ($reflectionClass->getAttributes(RequireAnyRole::class) as $attr) {
            $roleAny[] = $attr->newInstance()->roles;
        }
        if ($reflectionClass->getAttributes(AllowGuest::class) !== []) {
            $allowGuest = true;
        }

        // Method-level attributes layer on top. Only attempt to
        // reflect on the method when it actually exists — some
        // route bindings point at magic methods (`__invoke`) that
        // aren't declared in the traditional sense.
        if ($reflectionClass->hasMethod($method)) {
            $reflectionMethod = new ReflectionMethod($class, $method);

            foreach ($reflectionMethod->getAttributes(RequirePermission::class) as $attr) {
                $permAll[] = $attr->newInstance()->permissions;
            }
            foreach ($reflectionMethod->getAttributes(RequireAnyPermission::class) as $attr) {
                $permAny[] = $attr->newInstance()->permissions;
            }
            foreach ($reflectionMethod->getAttributes(RequireRole::class) as $attr) {
                $roleAll[] = $attr->newInstance()->roles;
            }
            foreach ($reflectionMethod->getAttributes(RequireAnyRole::class) as $attr) {
                $roleAny[] = $attr->newInstance()->roles;
            }
            if ($reflectionMethod->getAttributes(AllowGuest::class) !== []) {
                $allowGuest = true;
            }
        }

        return self::$cache[$cacheKey] = [
            'permissions_all' => $permAll,
            'permissions_any' => $permAny,
            'roles_all' => $roleAll,
            'roles_any' => $roleAny,
            'allow_guest' => $allowGuest,
        ];
    }

    /**
     * `true` when every attribute family is empty AND `#[AllowGuest]`
     * is absent — meaning the controller has opted into no gate at
     * all and the middleware can short-circuit without touching
     * `$request->user()`.
     *
     * `#[AllowGuest]` on its own IS a gate — a signal that the
     * caller has opted into "no auth required" — so we treat it
     * as non-empty here to distinguish it from "controller
     * doesn't care".
     *
     * @param array{
     *     permissions_all: list<list<string>>,
     *     permissions_any: list<list<string>>,
     *     roles_all: list<list<string>>,
     *     roles_any: list<list<string>>,
     *     allow_guest: bool,
     * } $attributes
     */
    private function isEmpty(array $attributes): bool
    {
        return $attributes['permissions_all'] === []
            && $attributes['permissions_any'] === []
            && $attributes['roles_all'] === []
            && $attributes['roles_any'] === []
            && ! $attributes['allow_guest'];
    }

    /**
     * Enforce that the user holds every listed permission across
     * every `#[RequirePermission]` attribute.
     *
     * Cross-attribute semantics: attribute-level AND, group-level
     * AND. Every group's every permission must be held.
     *
     * @param list<list<string>> $groups
     *
     * @throws AuthorizationException
     */
    private function enforceAllPermissions(Authenticatable $user, array $groups): void
    {
        foreach ($groups as $permissions) {
            foreach ($permissions as $permission) {
                if (! $this->userCan($user, $permission)) {
                    throw new AuthorizationException(sprintf(
                        'Missing required permission [%s].',
                        $permission,
                    ));
                }
            }
        }
    }

    /**
     * Enforce that every `#[RequireAnyPermission]` attribute is
     * satisfied by AT LEAST ONE of its listed permissions.
     *
     * Cross-attribute semantics: attribute-level OR, group-level
     * AND. If two `RequireAnyPermission` attributes are attached,
     * the user must satisfy BOTH independently.
     *
     * @param list<list<string>> $groups
     *
     * @throws AuthorizationException
     */
    private function enforceAnyPermissions(Authenticatable $user, array $groups): void
    {
        foreach ($groups as $permissions) {
            $satisfied = false;

            foreach ($permissions as $permission) {
                if ($this->userCan($user, $permission)) {
                    $satisfied = true;
                    break;
                }
            }

            if (! $satisfied) {
                throw new AuthorizationException(sprintf(
                    'Missing required permission — need at least one of [%s].',
                    implode(', ', $permissions),
                ));
            }
        }
    }

    /**
     * Enforce that the user holds every listed role across every
     * `#[RequireRole]` attribute.
     *
     * Uses `hasAllRoles()` from spatie/laravel-permission's
     * `HasRoles` trait. No `Gate::before` bypass — role checks
     * are ground-truth.
     *
     * @param list<list<string>> $groups
     *
     * @throws AuthorizationException
     */
    private function enforceAllRoles(Authenticatable $user, array $groups): void
    {
        foreach ($groups as $roles) {
            if (! method_exists($user, 'hasAllRoles') || ! $user->hasAllRoles($roles)) {
                throw new AuthorizationException(sprintf(
                    'Missing required roles — need all of [%s].',
                    implode(', ', $roles),
                ));
            }
        }
    }

    /**
     * Enforce that every `#[RequireAnyRole]` attribute is
     * satisfied by AT LEAST ONE of its listed roles.
     *
     * @param list<list<string>> $groups
     *
     * @throws AuthorizationException
     */
    private function enforceAnyRoles(Authenticatable $user, array $groups): void
    {
        foreach ($groups as $roles) {
            if (! method_exists($user, 'hasAnyRole') || ! $user->hasAnyRole($roles)) {
                throw new AuthorizationException(sprintf(
                    'Missing required role — need at least one of [%s].',
                    implode(', ', $roles),
                ));
            }
        }
    }

    /**
     * Bridge the `Authenticatable` interface to Laravel's Gate.
     *
     * `$user->can($ability)` isn't on the interface — it comes
     * from the `Authorizable` trait on `App\Models\User`. Since
     * the interface is what Laravel injects into the middleware,
     * we guard for the method's existence to keep this middleware
     * usable with alternative user models (e.g. an auth-only
     * shim without the Authorizable trait).
     */
    private function userCan(Authenticatable $user, string $ability): bool
    {
        if (! method_exists($user, 'can')) {
            return false;
        }

        return (bool) $user->can($ability);
    }
}
