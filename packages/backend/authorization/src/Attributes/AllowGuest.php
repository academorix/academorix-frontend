<?php

/**
 * @file packages/authorization/src/Attributes/AllowGuest.php
 *
 * @description
 * `#[AllowGuest]` — declarative "no authentication required"
 * marker. The
 * {@see \Stackra\Authorization\Middleware\AuthorizeControllerAction}
 * middleware short-circuits its unauthenticated-caller check when
 * this attribute is present on the class or method, letting the
 * request proceed without a resolved user.
 *
 * ## Why this is needed
 *
 * The default middleware behaviour is safe-by-default: any
 * controller that carries one of the `Require*` attributes AND
 * receives an unauthenticated request throws
 * {@see \Illuminate\Auth\AuthenticationException} (401).
 *
 * But some endpoints DO require public access even when the
 * enclosing controller carries auth attributes at the class
 * level:
 *
 * ```php
 * #[RequirePermission(AccountPermission::View)]
 * final class AccountController extends CrudController
 * {
 *     #[AllowGuest]
 *     public function healthcheck(): JsonResponse { … }
 * }
 * ```
 *
 * Without `#[AllowGuest]` the healthcheck endpoint would demand
 * `account.view`. With it, the middleware waves guests through
 * for that specific method while keeping every other action
 * gated.
 *
 * ## Precedence
 *
 * `#[AllowGuest]` beats every `Require*` attribute in scope:
 *
 *   - Method-level `#[AllowGuest]` overrides class-level
 *     `#[RequirePermission]` / `#[RequireRole]`.
 *   - Class-level `#[AllowGuest]` overrides ALL method-level
 *     gates (useful for public marketing controllers where every
 *     method should be public).
 *
 * The middleware STILL enforces the checks for authenticated
 * callers when `#[AllowGuest]` is present — meaning a logged-in
 * user hitting the healthcheck above still needs `account.view`.
 * If you want the endpoint completely open, don't attach any
 * `Require*` at all.
 *
 * ## No arguments
 *
 * The attribute is a pure marker — no fields, no configuration.
 * Its mere presence is the signal.
 */

declare(strict_types=1);

namespace Stackra\Authorization\Attributes;

use Attribute;

#[Attribute(Attribute::TARGET_CLASS | Attribute::TARGET_METHOD)]
final class AllowGuest
{
}
