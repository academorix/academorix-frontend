<?php

/**
 * @file packages/routing/src/Concerns/InteractsWithResponse.php
 *
 * @description
 * Controller-side helpers for building uniform JSON API responses.
 *
 * This trait is the ONLY place `response()` is defined in the
 * routing package. Sister traits ({@see InteractsWithPagination},
 * {@see InteractsWithResources}, {@see InteractsWithBulkOperations})
 * that need a builder do so by calling `$this->response()` on
 * the composing class — they no longer duplicate the method
 * signature via `@method` PHPDoc lies.
 *
 * ## History
 *
 * Previously the trait delegated to `Stackra\Response\Facades\Response`
 * — the extracted response package. That package was deleted in
 * favour of a slim in-routing builder ({@see ResponseBuilder}).
 * Every helper here now returns a fresh builder instance backed
 * by that class.
 *
 * @see \Stackra\Routing\Http\ResponseBuilder Value object emitted by every helper.
 */

declare(strict_types=1);

namespace Stackra\Routing\Concerns;

use Stackra\Routing\Http\ResponseBuilder;

/**
 * Provides semantic HTTP-status helpers on controllers.
 *
 * Every helper returns a {@see ResponseBuilder} so callers can
 * chain additional metadata / links / headers before Laravel
 * renders the response via `Responsable::toResponse()`.
 *
 * ## Usage
 *
 * ```php
 * class UserController extends BaseController
 * {
 *     public function show(int $id)
 *     {
 *         $user = User::findOrFail($id);
 *
 *         return $this->ok($user)
 *             ->addLink('self', route('users.show', $id))
 *             ->addLink('update', route('users.update', $id), 'PUT');
 *     }
 *
 *     public function store(StoreUserData $data)
 *     {
 *         $user = User::create($data->toArray());
 *
 *         return $this->created($user, 'User created.');
 *     }
 * }
 * ```
 */
trait InteractsWithResponse
{
    /**
     * Fresh {@see ResponseBuilder} for advanced chaining. Every
     * call returns a new instance — the builder holds request-
     * scoped mutable state, so caching would leak between calls
     * inside the same controller invocation.
     *
     * Use this when the named helpers ({@see ok()}, {@see created()},
     * etc.) don't cover the exact shape you need — for example,
     * a 418 response, a stream, or a hand-crafted meta block.
     */
    protected function response(): ResponseBuilder
    {
        return ResponseBuilder::make();
    }

    /**
     * 200 OK.
     *
     * @param  mixed        $data     Optional payload. `null` produces
     *                                a bodyless 200 (data key omitted).
     * @param  string|null  $message  Optional human-readable summary.
     */
    protected function ok(mixed $data = null, ?string $message = null): ResponseBuilder
    {
        $builder = $this->response()->ok($data);

        if ($message !== null) {
            $builder->message($message);
        }

        return $builder;
    }

    /**
     * 201 Created. Convention: `$data` is the newly created
     * resource, `$message` a short confirmation.
     */
    protected function created(mixed $data, ?string $message = null): ResponseBuilder
    {
        $builder = $this->response()->created($data);

        if ($message !== null) {
            $builder->message($message);
        }

        return $builder;
    }

    /**
     * 202 Accepted. Typically used for async operations that
     * returned an acknowledgement — `$data` might be a job id or
     * receipt payload.
     */
    protected function accepted(mixed $data = null, ?string $message = null): ResponseBuilder
    {
        $builder = $this->response()->accepted($data);

        if ($message !== null) {
            $builder->message($message);
        }

        return $builder;
    }

    /** 204 No Content. Body is empty per RFC 7230. */
    protected function noContent(): ResponseBuilder
    {
        return $this->response()->noContent();
    }

    /** 400 Bad Request — the request itself was malformed. */
    protected function badRequest(?string $message = null): ResponseBuilder
    {
        return $this->response()->badRequest($message);
    }

    /** 401 Unauthorized — no / invalid credentials. */
    protected function unauthorized(?string $message = null): ResponseBuilder
    {
        return $this->response()->unauthorized($message);
    }

    /** 403 Forbidden — authenticated but not permitted. */
    protected function forbidden(?string $message = null): ResponseBuilder
    {
        return $this->response()->forbidden($message);
    }

    /** 404 Not Found — resource genuinely doesn't exist. */
    protected function notFound(?string $message = null): ResponseBuilder
    {
        return $this->response()->notFound($message);
    }

    /** 409 Conflict — state conflict (duplicate, optimistic lock). */
    protected function conflict(?string $message = null): ResponseBuilder
    {
        return $this->response()->conflict($message);
    }

    /**
     * 422 Unprocessable Entity — semantic-level rejection.
     *
     * @param  array<string, list<string>|string>|null  $errors   Field map.
     * @param  string|null                              $message  Top-level summary.
     */
    protected function unprocessable(?array $errors = null, ?string $message = null): ResponseBuilder
    {
        return $this->response()->unprocessable($errors, $message);
    }

    /** 500 Internal Server Error — usually thrown, not returned. */
    protected function serverError(?string $message = null): ResponseBuilder
    {
        return $this->response()->serverError($message);
    }

    // The Blade `view()` helper that once lived here was removed on
    // 2026-07-21 (Phase C1). The workspace is headless per ADR-0021 +
    // `.kiro/steering/architecture.md` §Headless only — every
    // controller returns JSON via the builder above. Rendering a
    // Blade view from a controller is no longer supported at the
    // trait surface; callers that genuinely need HTML render it
    // outside the controller boundary and hand the string to
    // `response()`.
}
