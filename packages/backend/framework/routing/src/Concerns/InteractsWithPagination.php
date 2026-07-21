<?php

/**
 * @file packages/routing/src/Concerns/InteractsWithPagination.php
 *
 * @description
 * Controller-side helpers for paginated responses. Composes with
 * {@see InteractsWithResponse} (for the shared `response()`
 * factory) and {@see InteractsWithRequest} (for reading
 * `?page=` / `?per_page=` query params).
 *
 * ## Design
 *
 *   - **Hardcoded bounds.** `DEFAULT_PER_PAGE = 50`,
 *     `MAX_PER_PAGE = 100`. When we scaffold `packages/foundation/`
 *     Constants layer, promote these to shared literals. Until
 *     then the values live here so the routing package has zero
 *     dependencies on stubbed foundation packages.
 *
 *   - **422, not 400.** Out-of-range `page` / `per_page` values
 *     are semantic-level (the request PARSED fine, we just don't
 *     like the values). Raised as
 *     {@see ValidationException::withErrors()} so the exception
 *     handler emits the standard 422 problem-details response.
 *
 *   - **No @method PHPDoc.** Previous version documented
 *     `@method Response response()` on the trait to hint IDEs;
 *     that pattern turned into diagnostic-tool noise ("phantom
 *     trait method conflict"). This version depends on trait
 *     composition alone.
 *
 * @see InteractsWithResponse  Provides the actual `response()` method.
 * @see \Stackra\Routing\Http\ResponseBuilder  Emitted by the paginate helpers.
 */

declare(strict_types=1);

namespace Stackra\Routing\Concerns;

use Stackra\Exceptions\Http\ValidationException;
use Stackra\Routing\Http\ResponseBuilder;
use Illuminate\Contracts\Pagination\CursorPaginator;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Contracts\Pagination\Paginator;
use Illuminate\Database\Eloquent\Builder;

/**
 * Query-string aware pagination helpers.
 *
 * The trait DOES NOT define `response()` — it uses
 * {@see InteractsWithResponse::response()} on the composing
 * class. The composing class MUST also use
 * {@see InteractsWithResponse} and {@see InteractsWithRequest}
 * for the trait to compile cleanly at method dispatch time.
 */
trait InteractsWithPagination
{
    /**
     * Default page number when `?page=` is absent. Matches
     * Laravel's own default. Bumped to 1 (not 0) because our
     * API contract is 1-indexed.
     */
    public const int DEFAULT_PAGE = 1;

    /**
     * Default page size. Chosen large enough that most callers
     * don't need to override, small enough that unbounded queries
     * don't blow up worker memory.
     */
    public const int DEFAULT_PER_PAGE = 50;

    /**
     * Hard ceiling on `?per_page=`. Callers asking for more get
     * a 422. Prevents cheap-DoS via absurdly large page requests.
     * If a legitimate need for bigger pages emerges, a dedicated
     * `bulkExport` endpoint is the right escape hatch — not a
     * higher ceiling here.
     */
    public const int MAX_PER_PAGE = 100;

    /**
     * `?page=<n>` from the current request, defaulting to
     * {@see DEFAULT_PAGE}. Cast to int so callers don't have to.
     */
    protected function getPage(int $default = self::DEFAULT_PAGE): int
    {
        // Requires the composing class to also use
        // InteractsWithRequest — that's where query() comes from.
        return (int) $this->query('page', $default);
    }

    /**
     * `?per_page=<n>` from the current request, defaulting to
     * {@see DEFAULT_PER_PAGE}.
     */
    protected function getPerPage(int $default = self::DEFAULT_PER_PAGE): int
    {
        return (int) $this->query('per_page', $default);
    }

    /**
     * Validate pagination parameters against the trait's bounds.
     *
     * Throws {@see ValidationException} (mapped to 422 by the
     * exception handler) rather than a generic 400 — the request
     * parsed fine, we just don't like the values, which is
     * semantically 422 territory.
     *
     * @throws ValidationException When `$page < 1`, `$perPage < 1`,
     *                             or `$perPage > MAX_PER_PAGE`.
     */
    protected function validatePagination(int $page, int $perPage): void
    {
        // Accumulate all violations before throwing so the client
        // gets a single 422 with every problem, not a rapid-fire
        // series of single-field errors.
        $errors = [];

        if ($page < self::DEFAULT_PAGE) {
            $errors['page'] = [sprintf(
                'Page must be at least %d, got %d.',
                self::DEFAULT_PAGE,
                $page,
            )];
        }

        if ($perPage < 1) {
            $errors['per_page'] = [sprintf('Per page must be at least 1, got %d.', $perPage)];
        } elseif ($perPage > self::MAX_PER_PAGE) {
            $errors['per_page'] = [sprintf(
                'Per page cannot exceed %d, got %d.',
                self::MAX_PER_PAGE,
                $perPage,
            )];
        }

        if ($errors !== []) {
            throw ValidationException::withErrors($errors, 'Pagination parameters are out of range.');
        }
    }

    /**
     * Paginate a query builder and wrap the result in a
     * {@see ResponseBuilder}. Reads `?page=` / `?per_page=` from
     * the current request, applies bounds validation, and calls
     * `paginate()` under the hood.
     *
     * @param  Builder    $query    Eloquent builder to paginate.
     * @param  int|null   $perPage  Overrides `?per_page=` when supplied.
     */
    protected function paginate(Builder $query, ?int $perPage = null): ResponseBuilder
    {
        $page = $this->getPage();
        $perPage ??= $this->getPerPage();

        $this->validatePagination($page, $perPage);

        // Laravel's `paginate()` reads `?page=` internally via
        // the request; we pass it explicitly so callers can also
        // override via method args if they want.
        $paginator = $query->paginate($perPage, ['*'], 'page', $page);

        return $this->paginatedResponse($paginator);
    }

    /**
     * Wrap an existing paginator in a {@see ResponseBuilder}.
     * Useful when the paginator was built outside the controller
     * (e.g. inside a service) and the controller just needs to
     * render it.
     */
    protected function paginatedResponse(
        LengthAwarePaginator|CursorPaginator|Paginator $paginator,
        ?string $message = null,
    ): ResponseBuilder {
        $builder = $this->response()->paginate($paginator);

        if ($message !== null) {
            $builder->message($message);
        }

        return $builder;
    }
}
