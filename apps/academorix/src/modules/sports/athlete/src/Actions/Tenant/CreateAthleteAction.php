<?php

declare(strict_types=1);

namespace Academorix\Athlete\Actions\Tenant;

use Academorix\Athlete\Contracts\Data\AthleteInterface;
use Academorix\Athlete\Contracts\Services\AthleteProvisionerInterface;
use Academorix\Athlete\Data\AthleteData;
use Academorix\Athlete\Data\Requests\CreateAthleteRequestData;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Stackra\Routing\Concerns\AsController;
use Illuminate\Http\JsonResponse;

/**
 * `POST /api/v1/athletes` — create an Athlete row (tenant audience).
 *
 * Single-invoke controller. Every write-path invariant lives inside
 * {@see AthleteProvisionerInterface} — the guardian check for
 * minors, DOB bounds, consent-recorder authorisation, and the age-
 * group snapshot resolution. This action's ONE job is to pass the
 * validated payload + the current user's id through to the
 * provisioner and render the persisted row as {@see AthleteData}.
 *
 * @category Athlete
 *
 * @since    0.1.0
 */
#[AsAction(name: 'athlete.athletes.create')]
#[Post('/api/v1/athletes')]
#[Middleware(['api', 'auth:sanctum', 'tenant.resolve'])]
final class CreateAthleteAction
{
    use AsController;

    public function __construct(
        private readonly AthleteProvisionerInterface $provisioner,
    ) {
    }

    /**
     * Create a `athlete` from the validated request payload.
     *
     * @param  CreateAthleteRequestData  $data  Validated payload (Spatie Data DTO).
     *
     * @return JsonResponse  201 Created with the newly-persisted DTO.
     */
    public function __invoke(CreateAthleteRequestData $data): JsonResponse
    {
        $attributes = $data->toArray();

        // The provisioner enforces the tenant-scope check itself, but we
        // seed the payload's tenant_id from the request-resolved scope so a
        // missing tenant_id in the DTO doesn't leak past validation.
        $attributes[AthleteInterface::ATTR_TENANT_ID] ??= (string) tenant()?->getKey();

        $recorderUserId = optional(auth()->user())->getAuthIdentifier();
        $recorder = $recorderUserId === null ? null : (string) $recorderUserId;

        $athlete = $this->provisioner->provision($attributes, $recorder);

        return response()->json(
            AthleteData::from($athlete),
            JsonResponse::HTTP_CREATED,
        );
    }
}
