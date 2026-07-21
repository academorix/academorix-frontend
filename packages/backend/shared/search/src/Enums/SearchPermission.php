<?php

declare(strict_types=1);

namespace Stackra\Search\Enums;

use Stackra\Authorization\Contracts\PermissionEnum;
use Stackra\Authorization\Enums\Guard;
use Stackra\Enum\Attributes\Description;
use Stackra\Enum\Attributes\Label;
use Stackra\Enum\Attributes\Meta;
use Stackra\Enum\Enum;

/**
 * Permissions the Search module contributes.
 *
 * Every `search.*` case is bound to the `sanctum` tenant guard.
 * Every `platform.search.*` case is bound to the `platform_admin`
 * guard. Per-entity search visibility (e.g. `athletes.viewAny`) is
 * owned by the source domain module — the query engine filters
 * models against the requester's per-entity permissions via
 * `#[Searchable(requiredPermission:)]`.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum SearchPermission: string implements PermissionEnum
{
    use Enum;

    #[Label('Run search queries')]
    #[Description('Execute unified search queries via GET /api/v1/search.')]
    case Query = 'search.query';

    #[Label('Autocomplete')]
    #[Description('Execute autocomplete queries via GET /api/v1/search/suggest.')]
    case Suggest = 'search.suggest';

    #[Label('Record click-through')]
    #[Description('Record a click-through analytics event.')]
    case ClickRecord = 'search.click.record';

    #[Label('List indexes')]
    #[Description('List search indexes catalogued for the current tenant.')]
    case IndexesViewAny = 'search.indexes.viewAny';

    #[Label('View index')]
    #[Description('View a single search index detail row.')]
    case IndexesView = 'search.indexes.view';

    #[Label('List sync jobs')]
    #[Description('List the caller\'s search sync jobs.')]
    case SyncJobsViewAny = 'search.sync-jobs.viewAny';

    #[Label('View sync job')]
    #[Description('View a single sync job detail row.')]
    case SyncJobsView = 'search.sync-jobs.view';

    #[Label('Cancel sync job')]
    #[Description('Cancel a queued or running sync job.')]
    case SyncJobsCancel = 'search.sync-jobs.cancel';

    #[Label('List synonyms')]
    #[Description('List synonyms visible to the tenant.')]
    case SynonymsViewAny = 'search.synonyms.viewAny';

    #[Label('View synonym')]
    #[Description('View a single synonym.')]
    case SynonymsView = 'search.synonyms.view';

    #[Label('Create synonym')]
    #[Description('Create a tenant-owned synonym.')]
    case SynonymsCreate = 'search.synonyms.create';

    #[Label('Update synonym')]
    #[Description('Update a synonym (also grants disable on system rows).')]
    case SynonymsUpdate = 'search.synonyms.update';

    #[Label('Delete synonym')]
    #[Description('Delete a tenant-owned synonym.')]
    case SynonymsDelete = 'search.synonyms.delete';

    #[Label('List saved queries')]
    #[Description('List saved queries visible to the caller.')]
    case SavedQueriesViewAny = 'search.saved-queries.viewAny';

    #[Label('View saved query')]
    #[Description('View a single saved query.')]
    case SavedQueriesView = 'search.saved-queries.view';

    #[Label('Create saved query')]
    #[Description('Create a saved query.')]
    case SavedQueriesCreate = 'search.saved-queries.create';

    #[Label('Update saved query')]
    #[Description('Update a caller-owned saved query.')]
    case SavedQueriesUpdate = 'search.saved-queries.update';

    #[Label('Delete saved query')]
    #[Description('Delete a caller-owned saved query.')]
    case SavedQueriesDelete = 'search.saved-queries.delete';

    #[Label('Share saved query')]
    #[Description('Mark a saved query as tenant-wide shared.')]
    case SavedQueriesShare = 'search.saved-queries.share';

    #[Label('View analytics')]
    #[Description('View tenant search analytics dashboards.')]
    case AnalyticsView = 'search.analytics.view';

    #[Label('Platform — list indexes')]
    #[Description('List indexes across every tenant.')]
    case PlatformIndexesViewAny = 'platform.search.indexes.viewAny';

    #[Label('Platform — view index')]
    #[Description('View a single index across tenants.')]
    case PlatformIndexesView = 'platform.search.indexes.view';

    #[Label('Platform — reindex')]
    #[Description('Trigger a zero-downtime reindex on any tenant\'s index.')]
    case PlatformIndexesReindex = 'platform.search.indexes.reindex';

    #[Label('Platform — flush')]
    #[Description('Drop an index. Destructive; requires confirmation.')]
    case PlatformIndexesFlush = 'platform.search.indexes.flush';

    #[Label('Platform — list sync jobs')]
    #[Description('List sync jobs across every tenant.')]
    case PlatformSyncJobsViewAny = 'platform.search.sync-jobs.viewAny';

    #[Label('Platform — view sync job')]
    #[Description('View a single sync job across tenants.')]
    case PlatformSyncJobsView = 'platform.search.sync-jobs.view';

    #[Label('Platform — cancel sync job')]
    #[Description('Cancel any tenant\'s sync job, including terminal-state force cancel.')]
    case PlatformSyncJobsCancel = 'platform.search.sync-jobs.cancel';

    #[Label('Platform — engines health')]
    #[Description('View live engine reachability + latency.')]
    case PlatformEnginesView = 'platform.search.engines.view';

    #[Label('Platform — analytics')]
    #[Description('View cross-tenant analytics.')]
    case PlatformAnalyticsView = 'platform.search.analytics.view';

    /**
     * The Laravel guard this permission binds to.
     */
    public function guard(): Guard
    {
        return match (\str_starts_with($this->value, 'platform.')) {
            true  => Guard::PlatformAdmin,
            false => Guard::Sanctum,
        };
    }
}
