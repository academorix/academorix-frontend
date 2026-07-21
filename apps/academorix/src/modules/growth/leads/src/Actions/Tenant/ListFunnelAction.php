<?php

declare(strict_types=1);

namespace Stackra\Leads\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Leads\Contracts\Services\LeadFunnelReporterInterface;
use Stackra\Leads\Enums\LeadsPermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
use Illuminate\Http\Request;

/**
 * `GET /api/v1/leads/reports/funnel` — funnel + source rollups for the
 * caller's tenant.
 *
 * Query parameters:
 *
 *   - `?since=<ISO 8601>` — inclusive lower bound on `created_at`.
 *   - `?until=<ISO 8601>` — inclusive upper bound on `created_at`.
 *
 * Both bounds are optional. Missing bounds mean "everything, ever".
 *
 * Response envelope:
 *
 *   ```json
 *   {
 *     "data": {
 *       "stage_counts":    { "NEW": N, "CONTACTED": N, "QUALIFIED": N,
 *                            "TRIAL": N, "WON": N, "LOST": N },
 *       "source_counts":   { "web_form": N, "referral": N, ... },
 *       "conversion_rate": 0.1234,
 *       "period": { "since": "...", "until": "..." }
 *     }
 *   }
 *   ```
 *
 * The response is NOT a Data DTO — it's an aggregate view keyed
 * per-tenant with no persisted parent row.
 *
 * @category Leads
 *
 * @since    0.1.0
 */
#[AsAction(name: 'leads.funnel.report')]
#[Get('/api/v1/leads/reports/funnel')]
#[Middleware(['api', 'auth:sanctum', 'tenant.resolve'])]
#[RequirePermission(LeadsPermission::LeadsFunnelReportView)]
final class ListFunnelAction
{
    use AsController;

    public function __construct(
        private readonly LeadFunnelReporterInterface $reporter,
    ) {
    }

    /**
     * @return array<string, mixed>  Funnel report envelope.
     */
    public function __invoke(Request $request): array
    {
        $since = $this->parseDate($request->query('since'));
        $until = $this->parseDate($request->query('until'));

        return [
            'data' => [
                'stage_counts'    => $this->reporter->stageCounts($since, $until),
                'source_counts'   => $this->reporter->sourceCounts($since, $until),
                'conversion_rate' => $this->reporter->conversionRate($since, $until),
                'period'          => [
                    'since' => $since?->format(\DateTimeInterface::ATOM),
                    'until' => $until?->format(\DateTimeInterface::ATOM),
                ],
            ],
        ];
    }

    /**
     * Parse an ISO-8601 string; return `null` on failure. Callers
     * treat `null` as "no bound" and NEVER as "invalid input" — the
     * validator upstream should reject malformed strings before
     * they land here.
     */
    private function parseDate(mixed $raw): ?\DateTimeInterface
    {
        if (! \is_string($raw) || $raw === '') {
            return null;
        }

        try {
            return new \DateTimeImmutable($raw);
        } catch (\Exception) {
            return null;
        }
    }
}
