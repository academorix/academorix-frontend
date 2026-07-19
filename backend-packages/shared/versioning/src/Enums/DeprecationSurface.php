<?php

declare(strict_types=1);

namespace Academorix\Versioning\Enums;

use Academorix\Enum\Attributes\Description;
use Academorix\Enum\Attributes\Label;
use Academorix\Enum\Attributes\Meta;
use Academorix\Enum\Enum;

/**
 * Which public surface a deprecation notice targets.
 *
 * A notice may target a single surface (e.g. only the REST endpoints,
 * not the webhook event delivery) or all four via {@see self::All}.
 *
 * ## Cases
 *
 *  * {@see self::Rest}    — REST HTTP endpoints served under `/api/v1/...`.
 *  * {@see self::Webhook} — outbound webhook event payloads.
 *  * {@see self::Graphql} — GraphQL schema + resolvers.
 *  * {@see self::All}     — every surface at once.
 *
 * @category Versioning
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum DeprecationSurface: string
{
    use Enum;

    #[Label('REST')]
    #[Description('REST HTTP endpoints served under /api/v1/...')]
    case Rest = 'rest';

    #[Label('Webhook')]
    #[Description('Outbound webhook event payloads.')]
    case Webhook = 'webhook';

    #[Label('GraphQL')]
    #[Description('GraphQL schema + resolvers.')]
    case Graphql = 'graphql';

    #[Label('All')]
    #[Description('Every surface at once.')]
    case All = 'all';
}
