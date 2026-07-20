<?php

/**
 * @file packages/architecture/config/architecture.php
 *
 * @description
 * Publishable configuration for `academorix/architecture`. Merged
 * into the host app under the `architecture.*` key by
 * {@see \Academorix\Architecture\Providers\ArchitectureServiceProvider}.
 *
 * ## Sections
 *
 *   - `paths` — absolute or workspace-relative source roots the
 *     scanner walks.
 *   - `excludes` — directory names to skip inside the roots
 *     (relative names, applied recursively — Symfony Finder
 *     handles the pattern semantics).
 *   - `namespaces` — canonical namespace prefixes for each
 *     layer, keyed by {@see \Academorix\Architecture\Enums\LayerType}
 *     `->value`. Prefix comparison is done on the FQCN — every
 *     entry MUST end with a trailing backslash to avoid greedy
 *     matches (`App\Model` vs `App\ModelSomething`).
 *   - `base_classes` — parent-class short names used by the
 *     resolver as fallback signals when no attribute /
 *     interface / namespace hint is present.
 *   - `infra_path_prefixes` / `test_path_prefixes` — absolute
 *     path prefixes that put a file into `Infrastructure` /
 *     `Test` respectively BEFORE any other classification runs.
 *   - `rules.<rule_id>` — per-rule configuration, including a
 *     boolean `enabled` toggle, a `severity` string
 *     (`error` / `warning`), and rule-specific knobs.
 *
 * ## Environment overrides
 *
 * The paths section uses `base_path()` at merge time so
 * consumers don't have to duplicate the absolute prefix. Toggles
 * (`architecture.rules.*.enabled`) also honour env fallbacks so
 * ops can flip a rule per environment without a code change.
 */

declare(strict_types=1);

return [

    /*
    |--------------------------------------------------------------------------
    | Scan roots
    |--------------------------------------------------------------------------
    |
    | Absolute directory paths the scanner walks. Defaults cover the
    | conventional apps -> app src + database layout used across
    | Academorix backends. Add extra paths in per-env config when
    | needed.
    */

    'paths' => [
        base_path('apps'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Directory excludes
    |--------------------------------------------------------------------------
    |
    | Directory names Symfony Finder skips recursively. Everything under
    | these gets ignored — even if it matches a scan root.
    */

    'excludes' => [
        'vendor',
        'node_modules',
        'storage',
        '.git',
        'bootstrap/cache',
    ],

    /*
    |--------------------------------------------------------------------------
    | Namespace → layer map
    |--------------------------------------------------------------------------
    |
    | Keyed by LayerType->value. Each entry is a list of FQCN prefixes
    | ending with a trailing backslash so `App\Models\User` matches
    | `App\Models\` and `App\Http\Controllers\UserController` matches
    | `App\Http\Controllers\`. Order within a layer's list doesn't
    | matter (first hit wins).
    |
    | Add app-specific namespaces here rather than modifying the
    | resolver — the defaults cover the Laravel + Academorix conventions.
    */

    'namespaces' => [
        'model' => [
            'App\\Models\\',
        ],
        'repository' => [
            'App\\Repositories\\',
        ],
        'service' => [
            'App\\Services\\',
        ],
        'action' => [
            'App\\Actions\\',
        ],
        'controller' => [
            'App\\Http\\Controllers\\',
        ],
        'infrastructure' => [
            'App\\Providers\\',
            'App\\Http\\Middleware\\',
            'App\\Console\\',
            'App\\Observers\\',
            'App\\Policies\\',
            'App\\Notifications\\',
            'App\\Broadcasting\\',
            'App\\Jobs\\',
            'App\\Events\\',
            'App\\Listeners\\',
            'App\\Mail\\',
            'Database\\Factories\\',
            'Database\\Seeders\\',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Base-class hints
    |--------------------------------------------------------------------------
    |
    | Parent classes that flag a subclass as belonging to a specific
    | layer. Matched by SHORT NAME so aliased imports work
    | (e.g. `use Illuminate\Foundation\Auth\User as Authenticatable`
    | → the extends clause reads `Authenticatable`).
    */

    'base_classes' => [
        'model' => [
            'Model',
            'Authenticatable',
            'Pivot',
            'MorphPivot',
        ],
        'controller' => [
            'Controller',
            'BaseController',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Infrastructure path prefixes
    |--------------------------------------------------------------------------
    |
    | Absolute path prefixes for directories that live OUTSIDE the
    | primary namespace conventions but still belong to
    | Infrastructure — Laravel's database/migrations, tests/,
    | routes/, etc.
    */

    'infra_path_prefixes' => [
        base_path('apps'),  // Any file under any app's database/ or config/ folder.
    ],

    /*
    |--------------------------------------------------------------------------
    | Test path prefixes
    |--------------------------------------------------------------------------
    |
    | Absolute path prefixes for test roots. Everything under here is
    | classified as `Test` — no rules fire on test files.
    */

    'test_path_prefixes' => [
        base_path('apps/template/tests'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Per-rule configuration
    |--------------------------------------------------------------------------
    |
    | Every rule reads its own subtree here. `severity` accepts
    | `error` (blocks CI) or `warning` (reports only). `enabled`
    | (where present) is a hard on/off; rules without an `enabled`
    | key are always on.
    */

    'rules' => [

        // ---------------------------------------------------------
        // Layering — Model access control
        // ---------------------------------------------------------

        // The headline rule — enforces Model-through-Repository.
        'no_direct_model_access' => [
            'severity' => 'error',
            'model_namespaces' => [
                'App\\Models\\',
            ],
            // Absolute or workspace-relative path prefixes waived
            // from the rule. Prefer #[AllowsDirectModelAccess] on
            // the class itself; the path allowlist is the escape
            // hatch when the class isn't yours to annotate.
            'allowlist_paths' => [],
        ],

        // Strict-mode "Controller must not touch Repository".
        // Off by default — flip to true when the codebase has
        // enough Services to route reads through.
        'no_repository_from_controller' => [
            'enabled' => (bool) env('ARCHITECTURE_STRICT_CONTROLLERS', false),
            'severity' => 'warning',
            'repository_namespaces' => [
                'App\\Repositories\\',
            ],
        ],

        // ---------------------------------------------------------
        // Tier 1 — data-first + framework hygiene
        // ---------------------------------------------------------

        // Forbid FormRequest usage anywhere. Use spatie/laravel-data
        // input DTOs instead. See steering: data-first.md.
        'no_form_request' => [
            'severity' => 'error',
            'forbidden_bases' => [
                'Illuminate\\Foundation\\Http\\FormRequest',
            ],
        ],

        // Forbid JsonResource / ResourceCollection usage anywhere.
        // Use spatie/laravel-data output DTOs. See steering:
        // data-first.md.
        'no_json_resource' => [
            'severity' => 'error',
            'forbidden_bases' => [
                'Illuminate\\Http\\Resources\\Json\\JsonResource',
                'Illuminate\\Http\\Resources\\Json\\ResourceCollection',
            ],
        ],

        // Forbid facade imports in the Service / Action layer.
        // Regex-based; scope-aware detection lives in the PHPStan
        // extension (rule id: architecture.phpstan.no_facades_in_services).
        'no_facades_in_services' => [
            'severity' => 'error',
            'forbidden_namespaces' => [
                'Illuminate\\Support\\Facades\\',
            ],
            // Individual facades permitted despite the namespace
            // prefix. `Response` and `View` are typical exceptions
            // for controllers but NEVER for services — keep the
            // list tight.
            'allowed_facades' => [],
        ],

        // Controllers must extend Academorix\Routing\BaseController,
        // not Illuminate\Routing\Controller directly.
        'controller_extends_base' => [
            'severity' => 'error',
            'required_base' => 'Academorix\\Routing\\BaseController',
            'forbidden_bases' => [
                'Illuminate\\Routing\\Controller',
            ],
        ],

        // Every Controller must carry #[AsController]. Route
        // discovery relies on it — without it the route never
        // registers.
        'controller_needs_as_controller' => [
            'severity' => 'error',
            'required_attribute' => 'Academorix\\Routing\\Attributes\\AsController',
        ],

        // Every concrete Repository must carry #[Bind] so the
        // container knows what contract to bind it against.
        'repository_needs_bind' => [
            'severity' => 'error',
            'required_attribute' => 'Illuminate\\Container\\Attributes\\Bind',
        ],

        // Every Middleware class must carry #[AsMiddleware] so
        // Routing's discovery picks it up.
        'middleware_needs_as_middleware' => [
            'severity' => 'error',
            'required_attribute' => 'Academorix\\Routing\\Attributes\\AsMiddleware',
            'middleware_namespaces' => [
                'App\\Http\\Middleware\\',
            ],
        ],

        // Controllers, Services, Actions, and Jobs must be `final`.
        'final_domain_classes' => [
            'severity' => 'error',
            // Which layers require `final`. Repositories / Models /
            // Infrastructure DO NOT — Eloquent trait composition
            // and Repository interface extension are legitimate
            // use cases for non-final classes.
            'required_layers' => ['controller', 'service', 'action'],
        ],

        // Every non-config PHP file starts with declare(strict_types=1);
        'require_strict_types' => [
            'severity' => 'error',
            'exempt_paths' => [
                // Laravel config files pass through `include` and
                // are read as return arrays — strict_types applies
                // to the entire process by that time, and adding
                // it to every config file is churn without
                // benefit.
                '/config/',
                '/bootstrap/',
            ],
        ],

        // File-header docblock — @file + @description tags.
        'require_file_docblock' => [
            'severity' => 'warning',
            'required_tags' => ['@file', '@description'],
            'exempt_paths' => [
                '/config/',
                '/bootstrap/',
                '/database/migrations/',
            ],
        ],

        // ---------------------------------------------------------
        // Tier 2 — content-scan for Octane safety
        // ---------------------------------------------------------

        // env() outside config/ bypasses the config cache and reads
        // per-request under Octane. Use config('...') or the
        // #[Config] injection attribute.
        'no_env_outside_config' => [
            'severity' => 'error',
            'exempt_paths' => [
                '/config/',
                '/database/factories/',   // Factories use env() for test-time DB seeds.
                '/database/seeders/',
            ],
        ],

        // Route:: facade calls forbidden anywhere. Every URL is
        // declared via #[Get] / #[Post] / etc. on the controller.
        'no_route_facade' => [
            'severity' => 'error',
        ],

        // Static writable state on services leaks between requests
        // under Octane. Const is fine.
        'no_static_state_in_services' => [
            'severity' => 'error',
            'targeted_layers' => ['service', 'action', 'repository', 'controller'],
        ],

        // $request->validate([...]) inside a controller — should
        // be type-hinted spatie/laravel-data DTO instead.
        'no_request_validate_in_controller' => [
            'severity' => 'error',
        ],

        // app()->make() / resolve() inside constructors — hidden
        // per-request coupling under Octane singletons.
        'no_app_make_in_constructor' => [
            'severity' => 'error',
        ],

        // Model::query() / DB::table() inside services — should
        // route through a repository.
        'no_query_builder_in_services' => [
            'severity' => 'error',
            'model_namespaces' => [
                'App\\Models\\',
            ],
            'query_facades' => [
                'DB::table',
                'DB::query',
            ],
        ],

        // #[Singleton] classes may not inject request-scoped deps.
        // Regex-based sibling of the PHPStan-scope-aware rule.
        'no_singleton_on_scoped_deps' => [
            'severity' => 'error',
            'scoped_attributes' => [
                'Illuminate\\Container\\Attributes\\CurrentUser',
                'Illuminate\\Container\\Attributes\\Authenticated',
                'Illuminate\\Container\\Attributes\\RouteParameter',
                'Illuminate\\Container\\Attributes\\Context',
            ],
        ],

        // ---------------------------------------------------------
        // Tier 3 — filesystem existence checks
        // ---------------------------------------------------------

        // apps/*/routes/api.php and apps/*/routes/web.php must not
        // exist — controllers own their routes.
        'no_routes_folder' => [
            'severity' => 'error',
            'forbidden_files' => [
                'routes/api.php',
                'routes/web.php',
                'routes/channels.php',
            ],
        ],

        // apps/*/resources/ must not exist — every app is headless.
        'no_resources_folder' => [
            'severity' => 'error',
            'forbidden_directories' => [
                'resources',
            ],
        ],

        // apps/*/app/ must not exist — src/ is the source root.
        'no_app_folder' => [
            'severity' => 'error',
            'forbidden_directories' => [
                'app',
            ],
        ],

        // No RouteServiceProvider anywhere — Routing package handles
        // registration.
        'no_route_service_provider' => [
            'severity' => 'error',
            'forbidden_file_names' => [
                'RouteServiceProvider.php',
            ],
        ],

        // Migrations must define public function down() so they can
        // be rolled back.
        'migration_has_down' => [
            'severity' => 'error',
            'migration_directories' => [
                'database/migrations',
            ],
        ],

        // No .env file on disk — Doppler-only.
        'no_env_file' => [
            'severity' => 'error',
            'forbidden_files' => [
                '.env',
                '.env.local',
                '.env.production',
            ],
            // Allow list of files we tolerate.
            'allowed_files' => [
                '.env.example',
            ],
        ],

        // Files under Contracts/ that describe repositories must
        // end in `Interface`.
        'repository_interface_suffix' => [
            'severity' => 'warning',
            'contracts_directory' => 'Contracts',
            'repository_pattern' => '/Repository$/',
        ],

        // No Http\ namespace nesting — flat namespace convention.
        'no_http_namespace_nesting' => [
            'severity' => 'warning',
            'forbidden_segments' => [
                '\\Http\\',
            ],
        ],

        // ---------------------------------------------------------
        // Tier 4 — model / job / command shape
        // ---------------------------------------------------------

        // Models must declare #[Fillable] or #[Guarded] attributes,
        // not $fillable / $guarded properties.
        'model_uses_fillable_attribute' => [
            'severity' => 'warning',
            'accepted_attributes' => [
                'Illuminate\\Database\\Eloquent\\Attributes\\Fillable',
                'Illuminate\\Database\\Eloquent\\Attributes\\Guarded',
                'Illuminate\\Database\\Eloquent\\Attributes\\Unguarded',
            ],
        ],

        // Models should not declare side-effecting methods —
        // business actions belong on services.
        'model_no_side_effects' => [
            'severity' => 'warning',
            'forbidden_method_names' => [
                'send',
                'notify',
                'process',
                'charge',
                'refund',
                'dispatch',
                'execute',
                'handle',
            ],
        ],

        // Every enum must be : string backed.
        'enum_is_backed_string' => [
            'severity' => 'error',
        ],

        // Event properties must be readonly (checked on the
        // promoted-constructor properties).
        'event_readonly_properties' => [
            'severity' => 'warning',
            'event_indicators' => [
                'namespace_contains' => ['\\Events\\'],
            ],
        ],

        // ShouldQueue classes must carry #[Queue] + #[Timeout] +
        // #[Tries] attributes.
        'job_has_queue_attribute' => [
            'severity' => 'warning',
            'required_attributes' => [
                'Illuminate\\Queue\\Attributes\\Queue',
                'Illuminate\\Queue\\Attributes\\Timeout',
                'Illuminate\\Queue\\Attributes\\Tries',
            ],
            'triggering_interface' => 'ShouldQueue',
        ],

        // ShouldQueue classes must declare failed(\Throwable).
        'job_implements_failed' => [
            'severity' => 'warning',
            'required_method' => 'failed',
            'triggering_interface' => 'ShouldQueue',
        ],

        // Console commands must carry #[Signature], not $signature.
        'command_uses_attribute_signature' => [
            'severity' => 'warning',
            'required_attribute' => 'Illuminate\\Console\\Attributes\\Signature',
            'command_bases' => [
                'Illuminate\\Console\\Command',
            ],
        ],

    ],

];
