<?php

/**
 * @file packages/exceptions/lang/es/auth.php
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
    'unauthenticated' => 'Se requiere autenticación para acceder a este recurso.',
    'unauthenticated_missing_credentials' => 'Inicia sesión para continuar.',
    'unauthenticated_invalid_credentials' => 'El correo electrónico o la contraseña son incorrectos.',
    'unauthenticated_token_revoked' => 'Tu sesión ha sido revocada. Inicia sesión de nuevo.',

    // ---- TokenExpiredException -----------------------------------------
    'token_expired' => 'Tu sesión ha expirado. Inicia sesión de nuevo.',

    // ---- ForbiddenException --------------------------------------------
    'forbidden' => 'No tienes permiso para realizar esta acción.',
    'forbidden_missing_permission' => 'Necesitas el permiso «:permission» para realizar esta acción.',
    'forbidden_missing_role' => 'Necesitas el rol «:role» para realizar esta acción.',
    'forbidden_policy_denied' => 'No tienes permiso para :ability :model.',

    // ---- FeatureDisabledException --------------------------------------
    'feature_disabled' => 'Esta funcionalidad no está habilitada en tu cuenta.',
    'feature_disabled_flag' => 'La funcionalidad «:flag» no está habilitada en tu cuenta.',

];
