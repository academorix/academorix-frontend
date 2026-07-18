<?php

/**
 * @file packages/exceptions/lang/en/infrastructure.php
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

    'upstream_error' => 'A downstream service returned an error.',
    'upstream_error_named' => 'The :service service returned an error.',

    'timeout' => 'A downstream service took too long to respond.',
    'timeout_named' => 'The :service service took too long to respond.',

    'unavailable' => 'The service is temporarily unavailable. Please try again shortly.',
    'unavailable_dependency' => 'A required dependency is unavailable. Please try again shortly.',

    'maintenance' => 'The service is undergoing maintenance. Please try again shortly.',

    'configuration' => 'The service is misconfigured.',

];
