<?php

declare(strict_types=1);

namespace Stackra\SportsProgressSdk\Resources;

use Stackra\ApiSdk\Client\ApiConnector;
use Stackra\ApiSdk\Data\PaginatedResponse;
use Stackra\SportsProgressSdk\Data\ProgressAssessmentData;
use Stackra\SportsProgressSdk\Requests\ProgressAssessments\ListProgressAssessmentsAdminRequest;
use Stackra\SportsProgressSdk\Requests\ProgressAssessments\ProgressAssessmentsProgressAssessmentRequest;
use Stackra\SportsProgressSdk\Requests\ProgressAssessments\ShowProgressAssessmentRequest;
use Stackra\SportsProgressSdk\Requests\ProgressAssessments\UpdateProgressAssessmentRequest;
use Saloon\Http\Response;

/**
 * Peer Resource for the `progress-assessments` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/ProgressAssessments/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category ProgressSdk
 *
 * @since    0.1.0
 */
final readonly class ProgressAssessmentsResource
{
    /**
     * @param  ApiConnector  $connector  The Saloon connector supplied by the umbrella.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }


    /**
     * Custom — custom endpoint (hand-implement).
     *
     * @param  string  $athlete                Path parameter — athlete.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     *
     * @return mixed
     */
    public function progressAssessments(string $athlete, ?string $idempotencyKey = null): mixed
    {
        return $this->connector->send(new ProgressAssessmentsProgressAssessmentRequest($athlete, $idempotencyKey))->dto();
    }


    /**
     * Show one progressassessment.
     *
     * @param  string  $assessment             Path parameter — assessment.
     *
     * @return ProgressAssessmentData
     */
    public function show(string $assessment): ProgressAssessmentData
    {
        return $this->connector->send(new ShowProgressAssessmentRequest($assessment))->dto();
    }


    /**
     * Update one progressassessment.
     *
     * @param  string  $assessment             Path parameter — assessment.
     * @param  UpdateProgressAssessmentPayload  $payload  The write payload.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     *
     * @return ProgressAssessmentData
     */
    public function update(string $assessment, \Stackra\SportsProgressSdk\Payloads\ProgressAssessments\UpdateProgressAssessmentPayload $payload, ?string $idempotencyKey = null): ProgressAssessmentData
    {
        return $this->connector->send(new UpdateProgressAssessmentRequest($assessment, $payload, $idempotencyKey))->dto();
    }


    /**
     * List every progressassessment.
     *
     * @param  int|null  $page             1-indexed page.
     * @param  int|null  $perPage          Items per page.
     *
     * @return PaginatedResponse<ProgressAssessmentData>
     */
    public function listAdmin(?int $page = null, ?int $perPage = null): PaginatedResponse
    {
        return $this->connector->send(new ListProgressAssessmentsAdminRequest($page, $perPage))->dto();
    }
}
