<?php

/**
 * @file packages/exceptions/lang/en/http.php
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

    'not_found' => 'The requested resource could not be found.',
    'not_found_resource' => 'The requested :resource could not be found.',
    'entity_not_found' => 'That record no longer exists.',
    'method_not_allowed' => 'The HTTP method is not supported for this endpoint.',

    'conflict' => 'The requested change conflicts with the current state.',
    'conflict_duplicate' => 'A :resource with that identifier already exists.',
    'conflict_optimistic_lock' => 'This record was updated by someone else. Reload and try again.',
    'conflict_invalid_transition' => 'The requested change is not allowed from the current state.',

    'payload_too_large' => 'The uploaded content is too large.',
    'unsupported_media_type' => 'The Content-Type is not supported.',

    'validation' => 'The submitted data is invalid.',
    'unprocessable' => 'The request cannot be processed.',

    'too_many_requests' => 'Too many requests. Please try again later.',
    'payment_required' => 'Payment is required to continue.',
    'payment_required_seat_limit' => 'You have reached the seat limit for your plan.',
    'payment_required_upgrade' => 'This feature requires an upgraded plan.',
    'payment_required_insufficient_balance' => 'Your account balance is insufficient to complete this action.',

];
