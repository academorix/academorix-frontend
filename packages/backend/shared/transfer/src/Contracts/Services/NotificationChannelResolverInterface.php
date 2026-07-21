<?php

declare(strict_types=1);

namespace Stackra\Transfer\Contracts\Services;

use Stackra\Transfer\Services\DefaultNotificationChannelResolver;
use Illuminate\Container\Attributes\Bind;

/**
 * Resolves the notification channels for a transfer job.
 *
 * Precedence: request-supplied override > user setting > tenant
 * setting > `config('transfer.notifications.default_channels')`.
 * The resolved list is frozen onto `xfer_jobs.notify_channels` by
 * {@see \Stackra\Transfer\Observers\XferJobObserver} at creation
 * time so the dispatch path never re-resolves.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[Bind(DefaultNotificationChannelResolver::class)]
interface NotificationChannelResolverInterface
{
    /**
     * Resolve the channel list for a user in a tenant, honouring the
     * caller's optional request-time override.
     *
     * @param  list<string>|null  $requestOverride  Channels the caller supplied on the request.
     * @return list<string>
     */
    public function resolve(string $tenantId, string $userId, ?array $requestOverride = null): array;
}
