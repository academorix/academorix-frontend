<?php

/**
 * @file packages/exceptions/lang/fr/domain.php
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

    'rule_violated' => 'L\'action ne peut pas être effectuée.',
    'business_rule' => 'L\'action ne peut pas être effectuée car une règle métier a été enfreinte.',
    'business_rule_named' => 'L\'action ne peut pas être effectuée car la règle « :rule_id » a été enfreinte.',

    'invariant_violation' => 'Une erreur inattendue est survenue.',

    'tenancy' => 'La requête a un contexte d\'espace de travail invalide.',
    'tenancy_missing' => 'Connectez-vous à un espace de travail pour continuer.',
    'tenancy_cross_tenant' => 'La requête référence un espace de travail auquel vous n\'avez pas accès.',

];
