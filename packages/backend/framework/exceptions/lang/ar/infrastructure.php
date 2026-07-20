<?php

/**
 * @file packages/exceptions/lang/ar/infrastructure.php
 *
 * @description
 * User-facing copy for infrastructure-layer exceptions —
 * upstream integrations, timeouts, unavailable dependencies,
 * misconfiguration, and maintenance mode.
 *
 * `configuration` copy stays generic in every locale because the
 * underlying config key path is a bug signal for the ops team and
 * has no useful meaning for the end user.
 */

declare(strict_types=1);

return [

    'upstream_error' => 'أعادت خدمة تابعة استجابة خاطئة.',
    'upstream_error_named' => 'أعادت خدمة :service استجابة خاطئة.',

    'timeout' => 'استغرقت خدمة تابعة وقتًا طويلًا للاستجابة.',
    'timeout_named' => 'استغرقت خدمة :service وقتًا طويلًا للاستجابة.',

    'unavailable' => 'الخدمة غير متاحة مؤقتًا. يرجى إعادة المحاولة بعد قليل.',
    'unavailable_dependency' => 'إحدى التبعيات المطلوبة غير متاحة. يرجى إعادة المحاولة بعد قليل.',

    'maintenance' => 'الخدمة قيد الصيانة. يرجى إعادة المحاولة بعد قليل.',

    'configuration' => 'الخدمة مُهيَّأة بشكل غير صحيح.',

];
