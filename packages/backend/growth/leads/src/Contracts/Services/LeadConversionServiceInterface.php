<?php

declare(strict_types=1);

namespace Academorix\Leads\Contracts\Services;

use Academorix\Leads\Models\Lead;
use Academorix\Leads\Services\LeadConversionService;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Container\Attributes\Scoped;

/**
 * Service contract — the conversion path from a Qualified (or Trial)
 * lead into a set of persisted athletes plus a permanent stage flip
 * to WON.
 *
 * The orchestrator is idempotent on already-converted leads: if
 * `lead.stage === WON` and `converted_athlete_ids` is non-null, the
 * service returns the existing conversion payload without repeating
 * the write path.
 *
 * ## Materialisation is deferred
 *
 * The actual athlete + guardian rows are materialised by
 * `sports/athlete::AthleteProvisioner` — the conversion service
 * fires `LeadConverted` (an after-commit event) and the
 * `MaterialiseAthletesOnLeadConverted` listener in the sports module
 * picks it up. This service persists the stage flip + snapshot; the
 * `converted_athlete_ids` field is filled in by the listener's
 * response event once the athletes have IDs. That defers the
 * cross-module dependency and keeps the leads module bootable on its
 * own.
 *
 * Bound to the concrete via `#[Bind(LeadConversionService::class)]`.
 *
 * @category Leads
 *
 * @since    0.1.0
 */
#[Bind(LeadConversionService::class)]
#[Scoped]
interface LeadConversionServiceInterface
{
    /**
     * Convert the lead — atomically flip stage to WON, timestamp the
     * conversion, dispatch `LeadConverted`. Idempotent.
     *
     * @param  Lead  $lead  The row to convert.
     * @return Lead         The refreshed model post-flip.
     *
     * @throws \Academorix\Leads\Exceptions\LeadInvalidStageTransitionException  When the lead's current stage cannot transition to WON.
     * @throws \Academorix\Leads\Exceptions\LeadConversionAthletesRequiredException  When `athlete_names` is empty at conversion time.
     */
    public function convert(Lead $lead): Lead;
}
