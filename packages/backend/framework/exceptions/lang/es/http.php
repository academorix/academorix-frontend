<?php

/**
 * @file packages/exceptions/lang/es/http.php
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

    'not_found' => 'No se pudo encontrar el recurso solicitado.',
    'not_found_resource' => 'No se pudo encontrar el recurso :resource solicitado.',
    'entity_not_found' => 'Ese registro ya no existe.',
    'method_not_allowed' => 'El método HTTP no es compatible con este endpoint.',

    'conflict' => 'El cambio solicitado entra en conflicto con el estado actual.',
    'conflict_duplicate' => 'Ya existe un recurso :resource con ese identificador.',
    'conflict_optimistic_lock' => 'Otra persona actualizó este registro. Recarga e inténtalo de nuevo.',
    'conflict_invalid_transition' => 'El cambio solicitado no está permitido desde el estado actual.',

    'payload_too_large' => 'El contenido enviado es demasiado grande.',
    'unsupported_media_type' => 'El Content-Type no es compatible.',

    'validation' => 'Los datos enviados no son válidos.',
    'unprocessable' => 'La solicitud no puede procesarse.',

    'too_many_requests' => 'Demasiadas solicitudes. Inténtalo de nuevo más tarde.',
    'payment_required' => 'Se requiere un pago para continuar.',
    'payment_required_seat_limit' => 'Has alcanzado el límite de asientos de tu plan.',
    'payment_required_upgrade' => 'Esta funcionalidad requiere un plan superior.',
    'payment_required_insufficient_balance' => 'El saldo de tu cuenta es insuficiente para completar esta acción.',

];
