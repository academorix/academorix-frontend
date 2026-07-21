<?php

declare(strict_types=1);

namespace Stackra\Search\Enums;

use Stackra\Enum\Attributes\Description;
use Stackra\Enum\Attributes\Label;
use Stackra\Enum\Attributes\Meta;
use Stackra\Enum\Enum;

/**
 * Kind of {@see \Stackra\Search\Models\SearchAnalyticsEvent}.
 *
 * ## Cases
 *
 *  * {@see self::Query}         — a full query was executed.
 *  * {@see self::NoResults}     — a query returned zero results;
 *    surfaces index / synonym gaps to admin dashboards.
 *  * {@see self::ClickThrough}  — a user clicked a result from a
 *    previous query in the same session.
 *  * {@see self::Suggest}       — an autocomplete lookup ran.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum AnalyticsEventKind: string
{
    use Enum;

    #[Label('Query')]
    #[Description('A full search query was executed.')]
    case Query = 'query';

    #[Label('No Results')]
    #[Description('A search query returned zero results.')]
    case NoResults = 'no_results';

    #[Label('Click Through')]
    #[Description('A user clicked a result from a previous query in the same session.')]
    case ClickThrough = 'click_through';

    #[Label('Suggest')]
    #[Description('An autocomplete lookup was executed.')]
    case Suggest = 'suggest';
}
