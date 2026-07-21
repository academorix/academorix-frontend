<?php

declare(strict_types=1);

namespace Stackra\Subscription\Contracts\Repositories;

use Stackra\Crud\Contracts\RepositoryInterface;
use Stackra\Subscription\Models\Plan;
use Stackra\Subscription\Repositories\EloquentPlanRepository;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Support\Collection;

/**
 * Repository contract for {@see Plan}.
 *
 * Adds the four domain finders needed for the pricing UI + platform
 * admin catalogue on top of the base CRUD surface. Consumers depend
 * on this contract, not on the concrete `EloquentPlanRepository`.
 *
 * @extends RepositoryInterface<Plan>
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[Bind(EloquentPlanRepository::class)]
interface PlanRepositoryInterface extends RepositoryInterface
{
    /**
     * Every public plan (`is_public=true` + not deprecated + not
     * archived) for one Application, ordered by `sort_order`.
     *
     * @return Collection<int, Plan>
     */
    public function findPublicForApplication(string $applicationId): Collection;

    /**
     * One plan by `(application_id, key)`. Returns null when the
     * plan does not exist under the Application.
     *
     * @param  string  $applicationId  Owning Application.
     * @param  string  $key            Stable slug (e.g. `academy_team_monthly`).
     */
    public function findByKey(string $applicationId, string $key): ?Plan;

    /**
     * Every plan owned by an Application (including private +
     * deprecated + archived). Used by platform admin catalogue.
     *
     * @return Collection<int, Plan>
     */
    public function findAllForApplication(string $applicationId): Collection;

    /**
     * Count of active subscriptions referencing this plan. Used by
     * the observer + policy to refuse deletes on in-use plans.
     */
    public function countActiveSubscriptions(string $planId): int;
}
