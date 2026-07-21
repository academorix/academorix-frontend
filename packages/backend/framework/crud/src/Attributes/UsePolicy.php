<?php

declare(strict_types=1);

/**
 * @file packages/crud/src/Attributes/UsePolicy.php
 *
 * @description
 * `#[UsePolicy]` — declares the model class a
 * {@see \Stackra\Crud\Controllers\CrudController} should authorize
 * against via Laravel's `authorize()` helper, replacing the legacy
 * `abstract policyModel(): ?string` method with a declarative
 * attribute.
 *
 * ## What it does
 *
 * When a concrete resource controller is annotated with:
 *
 *   #[UsePolicy(User::class)]
 *
 * every action in the base {@see \Stackra\Crud\Controllers\CrudController}
 * calls `$this->authorize($ability, $model ?? User::class)`. The
 * corresponding policy class (typically `UserPolicy`) is resolved
 * by Laravel's Gate as usual — this attribute only supplies the
 * "which model class does this endpoint authorize against?" answer.
 *
 * ## Opt-out
 *
 * Two ways to skip policy checks for a controller:
 *
 *   1. **Omit the attribute entirely** — a controller without
 *      `#[UsePolicy]` still receives route-level authorization from
 *      middleware / `#[RequirePermission]` (see
 *      {@see \Stackra\Crud\Controllers\CrudController}'s "Two-layer
 *      authorization" docblock section), but no policy call fires.
 *
 *   2. **Set `enabled: false`** — useful when you want to keep the
 *      declaration for documentation / linting but disable the
 *      runtime call temporarily (e.g. during a rollout where the
 *      policy hasn't shipped yet).
 *
 *      #[UsePolicy(User::class, enabled: false)]
 *
 * ## Why an attribute (vs. keeping the method)
 *
 * Every other cross-cutting concern on a CRUD controller is
 * expressed via an attribute (`#[UseService]`, `#[UseData]`,
 * `#[AsController]`, `#[RequirePermission]`, ...). Keeping
 * `policyModel()` as an abstract method broke the uniformity —
 * concrete controllers had ONE method to override plus N
 * attributes. The attribute flattens the surface: every consumer
 * declares its wiring in one place at the top of the class.
 *
 * @category Attributes
 *
 * @since    1.0.0
 */

namespace Stackra\Crud\Attributes;

use Attribute;
use Illuminate\Database\Eloquent\Model;

#[Attribute(Attribute::TARGET_CLASS)]
final readonly class UsePolicy
{
    /**
     * @param class-string<Model> $model The Eloquent model class the
     *   policy authorizes against. Must extend Eloquent's Model.
     * @param bool $enabled When `false`, `#[UsePolicy]` is read but
     *   the runtime `authorize()` call is skipped. Useful for
     *   staged rollouts where a policy is being introduced.
     */
    public function __construct(
        public string $model,
        public bool $enabled = true,
    ) {
    }
}
