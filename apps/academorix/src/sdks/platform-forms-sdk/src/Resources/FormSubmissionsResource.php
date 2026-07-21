<?php

declare(strict_types=1);

namespace Stackra\PlatformFormsSdk\Resources;

use Stackra\ApiSdk\Client\ApiConnector;
use Stackra\ApiSdk\Data\PaginatedResponse;
use Stackra\PlatformFormsSdk\Data\FormSubmissionData;
use Stackra\PlatformFormsSdk\Requests\FormSubmissions\ListFormSubmissionsRequest;
use Stackra\PlatformFormsSdk\Requests\FormSubmissions\ShowFormSubmissionRequest;
use Saloon\Http\Response;

/**
 * Peer Resource for the `form-submissions` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/FormSubmissions/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category FormsSdk
 *
 * @since    0.1.0
 */
final readonly class FormSubmissionsResource
{
    /**
     * @param  ApiConnector  $connector  The Saloon connector supplied by the umbrella.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }


    /**
     * List every formsubmission.
     *
     * @param  int|null  $page             1-indexed page.
     * @param  int|null  $perPage          Items per page.
     *
     * @return PaginatedResponse<FormSubmissionData>
     */
    public function list(?int $page = null, ?int $perPage = null): PaginatedResponse
    {
        return $this->connector->send(new ListFormSubmissionsRequest($page, $perPage))->dto();
    }


    /**
     * Show one formsubmission.
     *
     * @param  string  $submission             Path parameter — submission.
     *
     * @return FormSubmissionData
     */
    public function show(string $submission): FormSubmissionData
    {
        return $this->connector->send(new ShowFormSubmissionRequest($submission))->dto();
    }
}
