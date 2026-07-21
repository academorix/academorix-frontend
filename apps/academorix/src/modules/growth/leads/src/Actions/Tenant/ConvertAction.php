<?php

declare(strict_types=1);

namespace Academorix\Leads\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Academorix\Leads\Contracts\Repositories\LeadRepositoryInterface;
use Academorix\Leads\Contracts\Services\LeadConversionServiceInterface;
use Academorix\Leads\Data\LeadData;
use Academorix\Leads\Enums\LeadsPermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Stackra\Routing\Concerns\AsController;

/**
 * `POST /api/v1/leads/{lead}/convert` — convert a qualified lead into
 * a WON row and hand off to the sports module for athlete
 * materialisation.
 *
 * Route through {@see LeadConversionServiceInterface} — the service
 * owns:
 *
 *   - the stage-transition guard (`LeadInvalidStageTransitionException`
 *     when the current stage cannot reach WON),
 *   - the `athlete_names` non-empty guard
 *     (`LeadConversionAthletesRequiredException`),
 *   - the atomic write (stage flip + audit-trail activity),
 *   - the `LeadConverted` after-commit event that triggers athlete
 *     provisioning downstream.
 *
 * @category Leads
 *
 * @since    0.1.0
 */
#[AsAction(name: 'leads.convert')]
#[Post('/api/v1/leads/{lead}/convert')]
#[Middleware(['api', 'auth:sanctum', 'tenant.resolve'])]
#[RequirePermission(LeadsPermission::LeadsConvert)]
final class ConvertAction
{
    use AsController;

    public function __construct(
        private readonly LeadRepositoryInterface $leads,
        private readonly LeadConversionServiceInterface $conversion,
    ) {
    }

    /**
     * @param  string  $lead  ULID from the URL.
     *
     * @throws \Illuminate\Database\Eloquent\ModelNotFoundException  When the row is absent / tenant-scoped out.
     * @throws \Academorix\Leads\Exceptions\LeadInvalidStageTransitionException  When the transition is refused.
     * @throws \Academorix\Leads\Exceptions\LeadConversionAthletesRequiredException  When `athlete_names` is empty.
     */
    public function __invoke(string $lead): LeadData
    {
        $row      = $this->leads->findOrFail($lead);
        $converted = $this->conversion->convert($row);

        return LeadData::from($converted);
    }
}
