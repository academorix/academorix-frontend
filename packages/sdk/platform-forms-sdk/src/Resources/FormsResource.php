<?php

declare(strict_types=1);

namespace Academorix\PlatformFormsSdk\Resources;

use Academorix\ApiSdk\Client\ApiConnector;
use Academorix\ApiSdk\Data\PaginatedResponse;
use Academorix\PlatformFormsSdk\Data\FormData;
use Academorix\PlatformFormsSdk\Requests\Forms\CreateFormRequest;
use Academorix\PlatformFormsSdk\Requests\Forms\DeleteFormRequest;
use Academorix\PlatformFormsSdk\Requests\Forms\ListFormsRequest;
use Academorix\PlatformFormsSdk\Requests\Forms\ShowFormRequest;
use Academorix\PlatformFormsSdk\Requests\Forms\UpdateFormRequest;
use Saloon\Http\Response;

/**
 * Peer Resource for the `forms` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/Forms/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category FormsSdk
 *
 * @since    0.1.0
 */
final readonly class FormsResource
{
    /**
     * @param  ApiConnector  $connector  The Saloon connector supplied by the umbrella.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }


    /**
     * List every form.
     *
     * @param  int|null  $page             1-indexed page.
     * @param  int|null  $perPage          Items per page.
     *
     * @return PaginatedResponse<FormData>
     */
    public function list(?int $page = null, ?int $perPage = null): PaginatedResponse
    {
        return $this->connector->send(new ListFormsRequest($page, $perPage))->dto();
    }


    /**
     * Create a form.
     *
     * @param  CreateFormPayload  $payload  The write payload.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     *
     * @return FormData
     */
    public function create(\Academorix\PlatformFormsSdk\Payloads\Forms\CreateFormPayload $payload, ?string $idempotencyKey = null): FormData
    {
        return $this->connector->send(new CreateFormRequest($payload, $idempotencyKey))->dto();
    }


    /**
     * Show one form.
     *
     * @param  string  $form                   Path parameter — form.
     *
     * @return FormData
     */
    public function show(string $form): FormData
    {
        return $this->connector->send(new ShowFormRequest($form))->dto();
    }


    /**
     * Update one form.
     *
     * @param  string  $form                   Path parameter — form.
     * @param  UpdateFormPayload  $payload  The write payload.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     *
     * @return FormData
     */
    public function update(string $form, \Academorix\PlatformFormsSdk\Payloads\Forms\UpdateFormPayload $payload, ?string $idempotencyKey = null): FormData
    {
        return $this->connector->send(new UpdateFormRequest($form, $payload, $idempotencyKey))->dto();
    }


    /**
     * Delete one form.
     *
     * @param  string  $form                   Path parameter — form.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     */
    public function delete(string $form, ?string $idempotencyKey = null): void
    {
        $this->connector->send(new DeleteFormRequest($form, $idempotencyKey));
    }


    /**
     * Show one form.
     *
     * @param  string  $signature              Path parameter — signature.
     *
     * @return FormData
     */
    public function show(string $signature): FormData
    {
        return $this->connector->send(new ShowFormRequest($signature))->dto();
    }
}
