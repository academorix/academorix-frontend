<?php

/**
 * @file packages/exceptions/lang/es/generic.php
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

    'unexpected' => 'Ocurrió un error inesperado. Inténtalo de nuevo en breve.',

    'timeout' => 'La solicitud tardó demasiado en completarse.',

];
