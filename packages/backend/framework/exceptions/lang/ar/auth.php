<?php

/**
 * @file packages/exceptions/lang/ar/auth.php
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
    'unauthenticated' => 'المصادقة مطلوبة للوصول إلى هذا المورد.',
    'unauthenticated_missing_credentials' => 'سجّل الدخول للمتابعة.',
    'unauthenticated_invalid_credentials' => 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
    'unauthenticated_token_revoked' => 'تم إلغاء جلستك. يرجى تسجيل الدخول من جديد.',

    // ---- TokenExpiredException -----------------------------------------
    'token_expired' => 'انتهت صلاحية جلستك. يرجى تسجيل الدخول من جديد.',

    // ---- ForbiddenException --------------------------------------------
    'forbidden' => 'ليست لديك الصلاحية لتنفيذ هذا الإجراء.',
    'forbidden_missing_permission' => 'تحتاج إلى صلاحية «:permission» لتنفيذ هذا الإجراء.',
    'forbidden_missing_role' => 'تحتاج إلى دور «:role» لتنفيذ هذا الإجراء.',
    'forbidden_policy_denied' => 'ليست لديك الصلاحية لـ :ability :model.',

    // ---- FeatureDisabledException --------------------------------------
    'feature_disabled' => 'هذه الميزة غير مُفعَّلة في حسابك.',
    'feature_disabled_flag' => 'الميزة «:flag» غير مُفعَّلة في حسابك.',

];
