<?php

/**
 * @file packages/exceptions/lang/fr/infrastructure.php
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

    'upstream_error' => 'Un service en aval a renvoyé une erreur.',
    'upstream_error_named' => 'Le service :service a renvoyé une erreur.',

    'timeout' => 'Un service en aval a mis trop de temps à répondre.',
    'timeout_named' => 'Le service :service a mis trop de temps à répondre.',

    'unavailable' => 'Le service est temporairement indisponible. Merci de réessayer sous peu.',
    'unavailable_dependency' => 'Une dépendance requise est indisponible. Merci de réessayer sous peu.',

    'maintenance' => 'Le service est en maintenance. Merci de réessayer sous peu.',

    'configuration' => 'Le service est mal configuré.',

];
