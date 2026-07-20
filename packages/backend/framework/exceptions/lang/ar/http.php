<?php

/**
 * @file packages/exceptions/lang/ar/http.php
 *
 * @description
 * User-facing copy for the HTTP-boundary exceptions.
 * Placeholder syntax follows Laravel's `:placeholder` convention.
 *
 * `not_found` intentionally stays generic — the entity variant
 * (`entity_not_found`) is the one that carries model + id and gets
 * shipped when it's helpful for the client to know which record is
 * missing. On public error pages we usually don't want to reveal
 * either.
 */

declare(strict_types=1);

return [

    'not_found' => 'تعذّر العثور على المورد المطلوب.',
    'not_found_resource' => 'تعذّر العثور على المورد :resource المطلوب.',
    'entity_not_found' => 'هذا السجل لم يعد موجودًا.',
    'method_not_allowed' => 'طريقة HTTP غير مدعومة لهذه النقطة الطرفية.',

    'conflict' => 'التغيير المطلوب يتعارض مع الحالة الحالية.',
    'conflict_duplicate' => 'يوجد بالفعل مورد :resource بهذا المعرّف.',
    'conflict_optimistic_lock' => 'حدّث شخص آخر هذا السجل. أعد التحميل ثم حاول مرة أخرى.',
    'conflict_invalid_transition' => 'التغيير المطلوب غير مسموح به من الحالة الحالية.',

    'payload_too_large' => 'المحتوى المُرسَل كبير جدًا.',
    'unsupported_media_type' => 'نوع المحتوى (Content-Type) غير مدعوم.',

    'validation' => 'البيانات المُرسَلة غير صالحة.',
    'unprocessable' => 'تعذّر معالجة الطلب.',

    'too_many_requests' => 'طلبات كثيرة جدًا. يرجى إعادة المحاولة لاحقًا.',
    'payment_required' => 'الدفع مطلوب للمتابعة.',
    'payment_required_seat_limit' => 'لقد بلغت الحدّ الأقصى للمقاعد في خطتك.',
    'payment_required_upgrade' => 'تتطلّب هذه الميزة ترقية خطتك.',
    'payment_required_insufficient_balance' => 'رصيد حسابك غير كافٍ لإتمام هذا الإجراء.',

];
