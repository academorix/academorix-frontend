<?php

declare(strict_types=1);

namespace Academorix\SportsProgressSdk\Enums;

/**
 * Wire-visible backed enum for `progress-card.card_type`.
 *
 * Backing type: string. Values are the exact snake_case tokens
 * the server emits.
 *
 * @category ProgressSdk
 *
 * @since    0.1.0
 */
enum ProgressCardCardType: string
{
    case FifaCard = 'fifa_card';
    case AttributeCard = 'attribute_card';
    case Radar = 'radar';
    case TimeTrial = 'time_trial';
    case ApparatusScores = 'apparatus_scores';
}
