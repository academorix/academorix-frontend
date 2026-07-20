<?php

declare(strict_types=1);

namespace Academorix\Search\Enums;

use Academorix\Enum\Attributes\Description;
use Academorix\Enum\Attributes\Label;
use Academorix\Enum\Attributes\Meta;
use Academorix\Enum\Enum;

/**
 * Kind of {@see \Academorix\Search\Models\SearchSynonym} entry.
 *
 * ## Cases
 *
 *  * {@see self::Equivalent} — every term is mutually interchangeable
 *    (flu ↔ influenza ↔ grippe).
 *  * {@see self::OneWay}     — one source term expands to a set of
 *    targets (a query for "sneaker" also matches "trainer", "kick"),
 *    but the reverse does not hold.
 *  * {@see self::Expansion}  — a query term is broadened with a set
 *    of expansions on the index side (documents containing any of
 *    them match the query).
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum SynonymKind: string
{
    use Enum;

    #[Label('Equivalent')]
    #[Description('Every term is mutually interchangeable.')]
    case Equivalent = 'equivalent';

    #[Label('One-way')]
    #[Description('A source term expands to a set of targets, but the reverse does not hold.')]
    case OneWay = 'one_way';

    #[Label('Expansion')]
    #[Description('A query term is broadened with a set of expansions on the index side.')]
    case Expansion = 'expansion';
}
