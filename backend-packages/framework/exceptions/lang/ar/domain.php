<?php

/**
 * @file packages/exceptions/lang/ar/domain.php
 *
 * @description
 * User-facing copy for domain-layer exceptions — business rules,
 * invariants, and tenancy failures.
 *
 * The `invariant_violation` copy is deliberately generic because
 * invariant failures are bugs: revealing the assertion text can
 * confuse the user and leak internals. Reporters still get the
 * full assertion in the exception context.
 */

declare(strict_types=1);

return [

    'rule_violated' => 'تعذّر إتمام الإجراء.',
    'business_rule' => 'تعذّر إتمام الإجراء بسبب مخالفة إحدى قواعد العمل.',
    'business_rule_named' => 'تعذّر إتمام الإجراء بسبب مخالفة القاعدة «:rule_id».',

    'invariant_violation' => 'حدث خطأ غير متوقع.',

    'tenancy' => 'سياق مساحة العمل في الطلب غير صالح.',
    'tenancy_missing' => 'سجّل الدخول إلى مساحة عمل للمتابعة.',
    'tenancy_cross_tenant' => 'يشير الطلب إلى مساحة عمل ليست لديك صلاحية الوصول إليها.',

];
