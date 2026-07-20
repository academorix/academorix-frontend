<?php

/**
 * @file packages/exceptions/lang/en/domain.php
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

    'rule_violated' => 'The action cannot be completed.',
    'business_rule' => 'The action cannot be completed because a business rule was violated.',
    'business_rule_named' => 'The action cannot be completed because the ":rule_id" rule was violated.',

    'invariant_violation' => 'An unexpected error occurred.',

    'tenancy' => 'The request has an invalid tenant context.',
    'tenancy_missing' => 'Sign in to a workspace to continue.',
    'tenancy_cross_tenant' => 'The request references a workspace you do not have access to.',

];
