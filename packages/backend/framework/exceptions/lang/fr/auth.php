<?php

/**
 * @file packages/exceptions/lang/fr/auth.php
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
    'unauthenticated' => 'Une authentification est requise pour accéder à cette ressource.',
    'unauthenticated_missing_credentials' => 'Connectez-vous pour continuer.',
    'unauthenticated_invalid_credentials' => 'L\'e-mail ou le mot de passe est incorrect.',
    'unauthenticated_token_revoked' => 'Votre session a été révoquée. Reconnectez-vous.',

    // ---- TokenExpiredException -----------------------------------------
    'token_expired' => 'Votre session a expiré. Reconnectez-vous.',

    // ---- ForbiddenException --------------------------------------------
    'forbidden' => 'Vous n\'avez pas la permission d\'effectuer cette action.',
    'forbidden_missing_permission' => 'Vous avez besoin de la permission « :permission » pour effectuer cette action.',
    'forbidden_missing_role' => 'Vous avez besoin du rôle « :role » pour effectuer cette action.',
    'forbidden_policy_denied' => 'Vous n\'avez pas la permission de :ability :model.',

    // ---- FeatureDisabledException --------------------------------------
    'feature_disabled' => 'Cette fonctionnalité n\'est pas activée pour votre compte.',
    'feature_disabled_flag' => 'La fonctionnalité « :flag » n\'est pas activée pour votre compte.',

];
