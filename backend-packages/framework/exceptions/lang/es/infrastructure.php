<?php

/**
 * @file packages/exceptions/lang/es/infrastructure.php
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

    'upstream_error' => 'Un servicio dependiente devolvió un error.',
    'upstream_error_named' => 'El servicio :service devolvió un error.',

    'timeout' => 'Un servicio dependiente tardó demasiado en responder.',
    'timeout_named' => 'El servicio :service tardó demasiado en responder.',

    'unavailable' => 'El servicio no está disponible temporalmente. Inténtalo de nuevo en breve.',
    'unavailable_dependency' => 'Una dependencia requerida no está disponible. Inténtalo de nuevo en breve.',

    'maintenance' => 'El servicio está en mantenimiento. Inténtalo de nuevo en breve.',

    'configuration' => 'El servicio está mal configurado.',

];
