<?php

declare(strict_types=1);

namespace Academorix\SportsProgressSdk\Resources;

use Academorix\ApiSdk\Client\ApiConnector;
use Academorix\ApiSdk\Data\PaginatedResponse;
use Academorix\SportsProgressSdk\Data\CoachNoteData;
use Academorix\SportsProgressSdk\Requests\CoachNotes\CreateCoachNoteRequest;
use Academorix\SportsProgressSdk\Requests\CoachNotes\ListCoachNotesRequest;
use Academorix\SportsProgressSdk\Requests\CoachNotes\UpdateCoachNoteRequest;
use Saloon\Http\Response;

/**
 * Peer Resource for the `coach-notes` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/CoachNotes/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category ProgressSdk
 *
 * @since    0.1.0
 */
final readonly class CoachNotesResource
{
    /**
     * @param  ApiConnector  $connector  The Saloon connector supplied by the umbrella.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }


    /**
     * List every coachnote.
     *
     * @param  int|null  $page             1-indexed page.
     * @param  int|null  $perPage          Items per page.
     *
     * @return PaginatedResponse<CoachNoteData>
     */
    public function list(?int $page = null, ?int $perPage = null): PaginatedResponse
    {
        return $this->connector->send(new ListCoachNotesRequest($page, $perPage))->dto();
    }


    /**
     * Create a coachnote.
     *
     * @param  CreateCoachNotePayload  $payload  The write payload.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     *
     * @return CoachNoteData
     */
    public function create(\Academorix\SportsProgressSdk\Payloads\CoachNotes\CreateCoachNotePayload $payload, ?string $idempotencyKey = null): CoachNoteData
    {
        return $this->connector->send(new CreateCoachNoteRequest($payload, $idempotencyKey))->dto();
    }


    /**
     * Update one coachnote.
     *
     * @param  string  $note                   Path parameter — note.
     * @param  UpdateCoachNotePayload  $payload  The write payload.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     *
     * @return CoachNoteData
     */
    public function update(string $note, \Academorix\SportsProgressSdk\Payloads\CoachNotes\UpdateCoachNotePayload $payload, ?string $idempotencyKey = null): CoachNoteData
    {
        return $this->connector->send(new UpdateCoachNoteRequest($note, $payload, $idempotencyKey))->dto();
    }
}
