<?php

/**
 * @file packages/exceptions/lang/es/domain.php
 *
 * @description
 * User-facing copy for domain-layer exceptions — business rules,
 * invariants, and tenancy failures.
 *
 * The `invariant_violation` copy is deliberately generic because
 * invariant failures are bugs: revealing the assertion text can
 * confuse the user and leak internals. Reporters still get the
 * full assertion in the exception context.
 */

declare(strict_types=1);

return [

    'rule_violated' => 'La acción no puede completarse.',
    'business_rule' => 'La acción no puede completarse porque se infringió una regla de negocio.',
    'business_rule_named' => 'La acción no puede completarse porque se infringió la regla «:rule_id».',

    'invariant_violation' => 'Ocurrió un error inesperado.',

    'tenancy' => 'La solicitud tiene un contexto de espacio de trabajo no válido.',
    'tenancy_missing' => 'Inicia sesión en un espacio de trabajo para continuar.',
    'tenancy_cross_tenant' => 'La solicitud hace referencia a un espacio de trabajo al que no tienes acceso.',

];
