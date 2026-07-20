<?php

declare(strict_types=1);

namespace Academorix\PlatformFormsSdk\Requests\FormSubmissions;

use Academorix\ApiSdk\Requests\BaseSdkRequest;
use Academorix\PlatformFormsSdk\Data\FormSubmissionData;
use Saloon\Enums\Method;
use Saloon\Http\Response;

/**
 * `GET /api/v1/form-submissions/{submission}` — show one FormSubmission.
 *
 * @category FormsSdk
 *
 * @since    0.1.0
 */
final class ShowFormSubmissionRequest extends BaseSdkRequest
{
    /**
     * HTTP verb.
     */
    protected Method $method = Method::GET;

    /**
     * @param  string       $submission             Path parameter — submission.
     */
    public function __construct(
        public readonly string $submission,
    ) {
    }

    /**
     * Return the request path relative to the connector base URL.
     */
    public function resolveEndpoint(): string
    {
        return '/api/v1/form-submissions/' . rawurlencode($this->submission);
    }

    /**
     * Hydrate the `{ "data": ... }` envelope into a
     * {@see FormSubmissionData}.
     */
    public function createDtoFromResponse(Response $response): FormSubmissionData
    {
        /** @var array<string, mixed> $payload */
        $payload = $response->json();
        /** @var array<string, mixed> $body */
        $body = isset($payload['data']) && is_array($payload['data'])
            ? $payload['data']
            : $payload;

        return FormSubmissionData::from($body);
    }
}
