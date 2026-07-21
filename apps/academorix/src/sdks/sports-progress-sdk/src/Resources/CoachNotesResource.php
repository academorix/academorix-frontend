<?php

declare(strict_types=1);

namespace Stackra\SportsProgressSdk\Resources;

use Stackra\ApiSdk\Client\ApiConnector;
use Stackra\ApiSdk\Data\PaginatedResponse;
use Stackra\SportsProgressSdk\Data\CoachNoteData;
use Stackra\SportsProgressSdk\Requests\CoachNotes\CreateCoachNoteRequest;
use Stackra\SportsProgressSdk\Requests\CoachNotes\ListCoachNotesRequest;
use Stackra\SportsProgressSdk\Requests\CoachNotes\UpdateCoachNoteRequest;
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
    public function create(\Stackra\SportsProgressSdk\Payloads\CoachNotes\CreateCoachNotePayload $payload, ?string $idempotencyKey = null): CoachNoteData
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
    public function update(string $note, \Stackra\SportsProgressSdk\Payloads\CoachNotes\UpdateCoachNotePayload $payload, ?string $idempotencyKey = null): CoachNoteData
    {
        return $this->connector->send(new UpdateCoachNoteRequest($note, $payload, $idempotencyKey))->dto();
    }
}
