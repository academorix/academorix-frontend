<?php

declare(strict_types=1);

/**
 * @file packages/crud/src/Controllers/CrudController.php
 *
 * @description
 * Generic RESTful CRUD controller providing `index()` / `show()` /
 * `store()` / `update()` / `destroy()` on top of a
 * {@see \Academorix\Crud\Contracts\ServiceInterface}.
 *
 * ## Zero abstract methods — everything is attribute-driven
 *
 * Concrete resource controllers declare their wiring via
 * class-level attributes and inherit the five CRUD actions AND
 * their RESTful routes:
 *
 *   #[AsController]
 *   #[Prefix('api/v1/users')]
 *   #[UseService(UserServiceInterface::class)]
 *   #[UseData(
 *       class:    UserData::class,
 *       store:    CreateUserData::class,   // optional override
 *       update:   UpdateUserData::class,   // optional override
 *       resource: UserResourceData::class, // optional override
 *   )]
 *   #[UsePolicy(User::class)]
 *   final class UserController extends CrudController {}
 *
 * That's the whole controller. No constructor, no method bodies,
 * no route file — the base class' method-level HTTP attributes
 * inherit into the subclass, so:
 *
 *   GET    /api/v1/users            → index()
 *   POST   /api/v1/users            → store()
 *   GET    /api/v1/users/{id}       → show()
 *   PUT    /api/v1/users/{id}       → update()
 *   PATCH  /api/v1/users/{id}       → update()  (same handler)
 *   DELETE /api/v1/users/{id}       → destroy()
 *
 * ## Attribute → resolver map
 *
 * | Attribute          | Resolves via                                    |
 * |--------------------|-------------------------------------------------|
 * | `#[UseService]`    | `service()` from Routing's `InteractsWithServices` |
 * | `#[UseData]`       | `storeDataClass()`, `updateDataClass()`, `resourceDataClass()` from `InteractsWithCrudDeclarations` |
 * | `#[UsePolicy]`     | `policyModel()` from `InteractsWithCrudDeclarations` |
 * | `#[AsController]`  | Registered as an HTTP controller by `Academorix\Routing` |
 * | `#[Prefix]`        | Prepended to every action route (Spatie route-attributes) |
 * | `#[Get]/#[Post]/…` | Method-level HTTP verb + path — inherited from this base |
 *
 * ## Route method attributes are on THIS base class
 *
 * `Spatie\RouteAttributes\Attributes\{Get, Post, Put, Patch, Delete}`
 * are placed on each action here. When a concrete controller
 * extends `CrudController`, Spatie's registrar walks the whole
 * inheritance chain and picks up the base-class attributes on the
 * subclass's inherited methods — so no per-controller route
 * declarations are needed.
 *
 * The `academorix/routing` package's `Get` / `Post` / etc.
 * attributes extend Spatie's directly, so the eventual migration
 * from Spatie's classes to Academorix's is a one-line import swap.
 * For now we use Spatie's directly to keep the base free of the
 * routing package's pending cleanup work.
 *
 * ## Two-layer authorization (defence in depth)
 *
 *  1. **Route-level permission / role gates** — subclasses attach
 *     one of the Access-module attributes on each method (or
 *     override the inherited method to add one):
 *
 *     ```php
 *     use Academorix\Access\Attributes\RequirePermission;
 *
 *     #[RequirePermission(PlatformUserPermission::View)]
 *     public function show(int|string $id): JsonResponse
 *     {
 *         return parent::show($id);
 *     }
 *     ```
 *
 *     The `AuthorizeControllerAction` middleware (registered on
 *     the `api` group in `bootstrap/app.php`) reflects on the
 *     attribute at request time and aborts unauthorised callers
 *     BEFORE route-model-binding runs.
 *
 *  2. **Record-level policy** — `authorizeWhenPolicied()` fires
 *     `$this->authorize($ability, $record)` on every action when
 *     `#[UsePolicy]` is present. Record-level rules that
 *     middleware can't express (owner, tenant match, status guard)
 *     live in the policy class.
 *
 * Both layers coexist. Middleware fires first (fast fail, no DB);
 * the policy runs on records the middleware waved through.
 * Backwards-compatible: subclasses that carry no `#[UsePolicy]`
 * fall back to the middleware layer alone.
 *
 * Controllers stay free of `try/catch`: domain exceptions and
 * framework exceptions render themselves through the central
 * exceptions handler.
 *
 * ## OpenAPI / Swagger documentation
 *
 * Spatie route-attributes carries OpenAPI metadata natively (via
 * the `#[OpenApi]` attributes provided by the routing package's
 * extensions). Scramble's `#[Group]` is NOT used here — the
 * routing attributes already emit the correct group/tags in the
 * generated OpenAPI document, so importing Scramble's Group would
 * duplicate the metadata.
 *
 * @template TModel of Model
 */

namespace Academorix\Crud\Controllers;

use Academorix\Crud\Concerns\Controller\InteractsWithCrudDeclarations;
use Academorix\Crud\Contracts\ServiceInterface;
use Academorix\Routing\Controller;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\LaravelData\Data;
use Spatie\RouteAttributes\Attributes\Delete;
use Spatie\RouteAttributes\Attributes\Get;
use Spatie\RouteAttributes\Attributes\Patch;
use Spatie\RouteAttributes\Attributes\Post;
use Spatie\RouteAttributes\Attributes\Put;

abstract class CrudController extends Controller
{
    use InteractsWithCrudDeclarations;

    /**
     * Page size used by {@see index()} listings.
     *
     * Subclasses override for endpoint-specific tuning:
     *
     *   protected int $perPage = 50;
     */
    protected int $perPage = 15;

    /**
     * Paginated listing. Filters, sorts and includes are read from
     * the request and constrained to the repository's allow-lists.
     *
     * Route: `GET /{resource-prefix}`
     * (e.g. `GET /api/v1/users` when the subclass carries
     * `#[Prefix('api/v1/users')]`).
     */
    #[Get('/')]
    public function index(): JsonResponse
    {
        $this->authorizeWhenPolicied('viewAny');

        $resource = $this->resourceDataClass();

        // Transform the paginator's items in place so the paginator
        // type is preserved. `apiResponse()` then lifts the pagination
        // details into `meta` and returns the transformed items as
        // `data`, rather than nesting a spatie PaginatedDataCollection
        // under `data`.
        $paginated = $this->service()->paginate($this->perPage)
            ->through(fn (Model $model): Data => $resource::from($model));

        return $this->apiResponse($paginated);
    }

    /**
     * Show a single model by primary key.
     *
     * Route: `GET /{resource-prefix}/{id}`.
     *
     * @param  int|string  $id  Primary key value.
     */
    #[Get('/{id}')]
    public function show(int|string $id): JsonResponse
    {
        $model = $this->service()->find($id);
        $this->authorizeWhenPolicied('view', $model);

        $resource = $this->resourceDataClass();

        return $this->apiResponse($resource::from($model));
    }

    /**
     * Create a model from a validated payload.
     *
     * Route: `POST /{resource-prefix}`.
     *
     * The payload is validated by the Data class configured under
     * `#[UseData(store: ...)]` (or the default `#[UseData(class: ...)]`
     * when no `store:` override was supplied).
     *
     * @param  Request  $request  The incoming request.
     */
    #[Post('/')]
    public function store(Request $request): JsonResponse
    {
        $this->authorizeWhenPolicied('create');

        $data = $this->storeDataClass()::from($request);
        $model = $this->service()->create($this->attributesFor($data));

        $resource = $this->resourceDataClass();

        return $this->apiCreated($resource::from($model));
    }

    /**
     * Update a model from a validated payload. Bound to both `PUT`
     * and `PATCH` — clients that treat PATCH as partial-update
     * hit the same handler; the Data class' validation rules
     * decide which fields are required.
     *
     * Route: `PUT|PATCH /{resource-prefix}/{id}`.
     *
     * The payload is validated by the Data class configured under
     * `#[UseData(update: ...)]` (or the default `#[UseData(class: ...)]`
     * when no `update:` override was supplied).
     *
     * @param  Request  $request  The incoming request.
     * @param  int|string  $id  Primary key value.
     */
    #[Put('/{id}')]
    #[Patch('/{id}')]
    public function update(Request $request, int|string $id): JsonResponse
    {
        $model = $this->service()->find($id);
        $this->authorizeWhenPolicied('update', $model);

        $data = $this->updateDataClass()::from($request);
        $updated = $this->service()->update($model, $this->attributesFor($data));

        $resource = $this->resourceDataClass();

        return $this->apiResponse($resource::from($updated));
    }

    /**
     * Delete a model by primary key.
     *
     * Route: `DELETE /{resource-prefix}/{id}`.
     *
     * @param  int|string  $id  Primary key value.
     */
    #[Delete('/{id}')]
    public function destroy(int|string $id): JsonResponse
    {
        $model = $this->service()->find($id);
        $this->authorizeWhenPolicied('delete', $model);

        $this->service()->delete($model);

        return $this->apiNoContent();
    }

    // -------------------------------------------------------------------
    // Extension points — override only when your resource deviates.
    // -------------------------------------------------------------------

    /**
     * Map a validated input Data object to persistable attributes.
     *
     * Override when input property names diverge from column names
     * (e.g. camelCase DTO fields mapped to snake_case columns).
     *
     * @param  Data  $data  The validated input Data.
     * @return array<string, mixed> Attributes to persist.
     */
    protected function attributesFor(Data $data): array
    {
        return $data->toArray();
    }

    /**
     * Convenience type-narrowing accessor for subclasses that need
     * to call service methods not present on
     * {@see ServiceInterface}. Wraps the inherited `service()`
     * getter with the template-parametrised return type so PHPStan
     * / IDE tooling can infer the concrete `ServiceInterface<TModel>`
     * shape.
     *
     * Consumers rarely need to override this — `service()` from
     * Routing's `InteractsWithServices` trait handles the standard
     * cases.
     *
     * @return ServiceInterface<TModel>
     */
    protected function typedService(): ServiceInterface
    {
        /** @var ServiceInterface<TModel> $service */
        $service = $this->service();

        return $service;
    }

    // -------------------------------------------------------------------
    // Internal helpers
    // -------------------------------------------------------------------

    /**
     * Authorize an ability against the configured `#[UsePolicy]`
     * model, if any.
     *
     * When the concrete controller lacks `#[UsePolicy]` (or its
     * `enabled` flag is `false`), this is a no-op — the caller
     * relies on route-level middleware / `#[RequirePermission]`
     * for authorization instead.
     *
     * @param  string  $ability  Policy ability (`viewAny`, `view`,
     *                          `create`, `update`, `delete`, or
     *                          any custom ability the policy
     *                          exposes).
     * @param  TModel|null  $model  The model instance for
     *                              item-level abilities. Class-level
     *                              abilities (`viewAny`, `create`)
     *                              fall back to the policy model
     *                              class.
     */
    private function authorizeWhenPolicied(string $ability, ?Model $model = null): void
    {
        $policyModel = $this->policyModel();

        if ($policyModel === null) {
            return;
        }

        $this->authorize($ability, $model ?? $policyModel);
    }
}
