<?php

/**
 * @file packages/exceptions/lang/en/auth.php
 *
 * @description
 * User-facing copy for the auth-family exceptions.
 * Placeholder syntax follows Laravel's `:placeholder` convention;
 * values come from `withTranslationParameters([...])` on the
 * exception instance.
 *
 * Keys mirror the exception class layout so the translation is easy
 * to find from the throw site — e.g. `ForbiddenException::missingPermission`
 * lives at `forbidden.missing_permission`.
 */

declare(strict_types=1);

return [

    // ---- AuthenticationException ---------------------------------------
    'unauthenticated' => 'Authentication is required to access this resource.',
    'unauthenticated_missing_credentials' => 'Sign in to continue.',
    'unauthenticated_invalid_credentials' => 'The email or password is incorrect.',
    'unauthenticated_token_revoked' => 'Your session has been revoked. Sign in again.',

    // ---- TokenExpiredException -----------------------------------------
    'token_expired' => 'Your session has expired. Sign in again.',

    // ---- ForbiddenException --------------------------------------------
    'forbidden' => 'You do not have permission to perform this action.',
    'forbidden_missing_permission' => 'You need the ":permission" permission to perform this action.',
    'forbidden_missing_role' => 'You need the ":role" role to perform this action.',
    'forbidden_policy_denied' => 'You do not have permission to :ability :model.',

    // ---- FeatureDisabledException --------------------------------------
    'feature_disabled' => 'This feature is not enabled for your account.',
    'feature_disabled_flag' => 'The ":flag" feature is not enabled for your account.',

];
