<?php

/**
 * @file packages/exceptions/lang/ar/generic.php
 *
 * @description
 * Fallback translations for exceptions that don't slot into a
 * specific domain (auth / http / domain / infrastructure). The
 * `unexpected` key is the safety net every renderer falls back to
 * when nothing more specific matches.
 *
 * Apps override individual strings by copying entries into
 * `lang/vendor/exceptions/<locale>/generic.php` after running
 * `php artisan vendor:publish --tag=exceptions-lang`.
 */

declare(strict_types=1);

return [

    'unexpected' => 'حدث خطأ غير متوقع. يرجى إعادة المحاولة بعد قليل.',

    'timeout' => 'استغرق الطلب وقتًا طويلًا لإتمامه.',

];
