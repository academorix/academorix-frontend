<?php

/**
 * @file packages/exceptions/lang/fr/http.php
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

    'not_found' => 'La ressource demandée est introuvable.',
    'not_found_resource' => 'La ressource :resource demandée est introuvable.',
    'entity_not_found' => 'Cet enregistrement n\'existe plus.',
    'method_not_allowed' => 'La méthode HTTP n\'est pas prise en charge pour ce point d\'accès.',

    'conflict' => 'Le changement demandé entre en conflit avec l\'état actuel.',
    'conflict_duplicate' => 'Une ressource :resource avec cet identifiant existe déjà.',
    'conflict_optimistic_lock' => 'Cet enregistrement a été modifié par un autre utilisateur. Rechargez et réessayez.',
    'conflict_invalid_transition' => 'Le changement demandé n\'est pas autorisé depuis l\'état actuel.',

    'payload_too_large' => 'Le contenu envoyé est trop volumineux.',
    'unsupported_media_type' => 'Le type de contenu n\'est pas pris en charge.',

    'validation' => 'Les données soumises sont invalides.',
    'unprocessable' => 'La requête ne peut pas être traitée.',

    'too_many_requests' => 'Trop de requêtes. Merci de réessayer plus tard.',
    'payment_required' => 'Un paiement est requis pour continuer.',
    'payment_required_seat_limit' => 'Vous avez atteint la limite de places de votre forfait.',
    'payment_required_upgrade' => 'Cette fonctionnalité nécessite un forfait supérieur.',
    'payment_required_insufficient_balance' => 'Le solde de votre compte est insuffisant pour effectuer cette action.',

];
