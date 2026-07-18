<?php

/**
 * @file packages/exceptions/lang/en/generic.php
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

    'unexpected' => 'An unexpected error occurred. Please try again shortly.',

    'timeout' => 'The request took too long to complete.',

];
