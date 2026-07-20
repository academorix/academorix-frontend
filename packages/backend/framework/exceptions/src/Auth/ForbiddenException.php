<?php

/**
 * @file packages/exceptions/src/Auth/ForbiddenException.php
 *
 * @description
 * HTTP 403 — the caller is authenticated but not permitted to perform
 * the requested action. Thrown from Gates, Policies, and any ad-hoc
 * authorisation check.
 *
 * ## Why not Laravel's built-in `AuthorizationException`
 *
 * The framework's built-in exception is a simple message + status
 * carrier. It has no `errorCode`, no `context`, no `category`, no
 * `severity`. Every downstream reader — the JSON renderer, the
 * Sentry enricher, the log reporter, the dashboards — would need
 * special-case handling for it. Prefer this class; the mapper
 * converts framework `AuthorizationException` instances into this
 * one automatically at the handler boundary.
 *
 * ## Named factories
 *
 *   - {@see missingPermission()} — Spatie/laravel-permission style checks.
 *   - {@see missingRole()}       — role-based gates.
 *   - {@see policyDenied()}      — Policy::method returned false.
 *
 * All three attach structured `context` and matching translation
 * parameters so the client-facing message can name the missing
 * capability without leaking internal policy identifiers.
 *
 * ## Translation keys
 *
 *   exceptions::auth.forbidden                    (class default)
 *   exceptions::auth.forbidden_missing_permission ({@see missingPermission()})
 *   exceptions::auth.forbidden_missing_role       ({@see missingRole()})
 *   exceptions::auth.forbidden_policy_denied      ({@see policyDenied()})
 *
 * @see \Academorix\Exceptions\AcademorixException  Base class.
 * @see \Academorix\Exceptions\Concerns\TranslatesMessages
 * @see \Academorix\Exceptions\Auth\AuthenticationException  For 401 — "who are you?" — instead of 403 "what may you do?".
 */

declare(strict_types=1);

namespace Academorix\Exceptions\Auth;

use Academorix\Exceptions\AcademorixException;
use Academorix\Exceptions\Enums\ErrorCategory;
use Academorix\Exceptions\Enums\ErrorSeverity;
use Symfony\Component\HttpFoundation\Response;

class ForbiddenException extends AcademorixException
{
    /**
     * Machine-readable code — the literal clients branch on. Treat
     * as public API.
     */
    public const CODE = 'auth.forbidden';

    /**
     * Class-level translation key pointing at
     * `lang/en/auth.php → forbidden`. Named factories override with
     * more specific keys per callsite.
     */
    public const TRANSLATION_KEY = 'exceptions::auth.forbidden';

    /**
     * Warning severity — routine 403s should not page on-call. If a
     * specific 403 is actually suspicious (repeated cross-tenant
     * attempts, say), raise it via `->withSeverity(Alert)` at the
     * callsite, not at the class level.
     */
    protected ErrorSeverity $severity = ErrorSeverity::Warning;

    /**
     * Dashboard bucket — `Authorization` separates "action denied
     * by policy" from `Authentication` ("who are you?") and
     * `Tenancy` ("wrong workspace"). Reporters route to different
     * channels based on this value.
     */
    protected ErrorCategory $category = ErrorCategory::Authorization;

    /**
     * 403 — the standard status for "understood the request, will
     * not fulfil it because you lack authorisation". Distinct from
     * 401 (missing credentials).
     */
    protected int $httpStatus = Response::HTTP_FORBIDDEN;

    /**
     * Named factory: caller lacks a specific permission bit.
     *
     * The `:permission` placeholder is interpolated into the
     * translated user message so the UI can show which permission
     * is missing — safe to expose because permission names are a
     * documented part of the RBAC API.
     *
     * @param  string  $permission  RBAC permission identifier
     *                              (e.g. `billing.write`,
     *                              `users.invite`). Must match the
     *                              value on the caller's
     *                              `permissions` table.
     * @return static The fluent instance with the permission in
     *                both context and translation parameters.
     */
    public static function missingPermission(string $permission): static
    {
        return static::make("Missing permission \"{$permission}\".")
            ->withContext(['permission' => $permission])
            ->withTranslationParameters(['permission' => $permission])
            ->withTranslationKey('exceptions::auth.forbidden_missing_permission');
    }

    /**
     * Named factory: caller lacks a specific role.
     *
     * Same shape as {@see missingPermission()} but for coarser-grained
     * role-based checks (typical of Spatie/laravel-permission).
     * Prefer permission-level checks when possible; roles are a
     * coarser signal.
     *
     * @param  string  $role  Role identifier ("admin", "instructor",
     *                        "student"). Matches the `roles.name`
     *                        column.
     * @return static The fluent instance.
     */
    public static function missingRole(string $role): static
    {
        return static::make("Missing role \"{$role}\".")
            ->withContext(['role' => $role])
            ->withTranslationParameters(['role' => $role])
            ->withTranslationKey('exceptions::auth.forbidden_missing_role');
    }

    /**
     * Named factory: a Policy method returned false for the ability.
     *
     * The `:ability` placeholder should be a human-friendly verb —
     * "view", "edit", "delete" — matching the Policy method name.
     * The `$modelClass` is stored in context for logs / dashboards
     * but is NOT surfaced in the user message (leaking model class
     * names to end users is confusing at best).
     *
     * @param  string  $ability     Verb naming the Policy method
     *                              that returned false ("update",
     *                              "delete", "view").
     * @param  string  $modelClass  Fully-qualified class name of the
     *                              subject model. Retained in
     *                              context for grouping, redacted
     *                              from user output.
     * @return static The fluent instance carrying both fields in
     *                context.
     */
    public static function policyDenied(string $ability, string $modelClass): static
    {
        return static::make("Policy denied \"{$ability}\" on {$modelClass}.")
            ->withContext(['ability' => $ability, 'model' => $modelClass])
            ->withTranslationParameters(['ability' => $ability])
            ->withTranslationKey('exceptions::auth.forbidden_policy_denied');
    }
}
