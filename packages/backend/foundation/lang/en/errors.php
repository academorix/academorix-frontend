<?php

declare(strict_types=1);

/**
 * @file packages/foundation/lang/en/errors.php
 *
 * @description
 * Copy for the Blade error pages shipped by `academorix/exceptions`
 * (which extend `foundation::layouts.app`). Kept in foundation
 * rather than exceptions because:
 *
 *   1. The layout itself lives in foundation, so it can't reference
 *      an `exceptions::` translation namespace without creating a
 *      backward package dependency.
 *   2. Any app that wants its OWN layout can still consume the same
 *      copy — no forced coupling to the exceptions package.
 *
 * ## Key layout
 *
 *   `<status>_title`    — the h1 / browser tab title
 *   `<status>_message`  — the paragraph body copy
 *   `go_back_home`      — CTA button label pointing at `/`
 *   `go_back`           — CTA button label for "back to previous"
 *
 * ## Translations
 *
 * Sibling files under `fr/`, `es/`, `ar/` mirror this structure.
 * Apps override via `php artisan vendor:publish --tag=foundation-lang`.
 */

return [

    // ---- 4xx client errors -----------------------------------------------

    '400_title' => 'Bad request',
    '400_message' => 'The request could not be understood. Check the URL and try again.',

    '401_title' => 'Authentication required',
    '401_message' => 'You need to sign in to access this page.',

    '402_title' => 'Payment required',
    '402_message' => 'This action requires an active subscription or a positive balance.',

    '403_title' => 'Access denied',
    '403_message' => 'You do not have permission to view this page.',

    '404_title' => 'Page not found',
    '404_message' => 'The page you were looking for does not exist, or has been moved.',

    '405_title' => 'Method not allowed',
    '405_message' => 'This action is not supported on the current page.',

    '408_title' => 'Request timed out',
    '408_message' => 'The request took too long. Check your connection and try again.',

    '419_title' => 'Session expired',
    '419_message' => 'Your session has expired. Refresh the page and try again.',

    '422_title' => 'Invalid input',
    '422_message' => 'The information you submitted is invalid. Please review and try again.',

    '429_title' => 'Too many requests',
    '429_message' => 'You have made too many requests in a short time. Please wait a moment.',

    // ---- 5xx server errors -----------------------------------------------

    '500_title' => 'Something went wrong',
    '500_message' => 'An unexpected error occurred on our end. Our team has been notified.',

    '502_title' => 'Bad gateway',
    '502_message' => 'A dependent service is unreachable. Please try again shortly.',

    '503_title' => 'Service unavailable',
    '503_message' => 'The service is temporarily unavailable. Please try again shortly.',

    '504_title' => 'Gateway timeout',
    '504_message' => 'A dependent service took too long to respond. Please try again shortly.',

    // ---- CTA labels ------------------------------------------------------

    'go_back_home' => 'Return home',
    'go_back' => 'Go back',
    'refresh' => 'Refresh the page',
    'contact_support' => 'Contact support',

];
