<?php

/**
 * @file packages/architecture/src/Enums/LayerType.php
 *
 * @description
 * Canonical vocabulary for the architectural layers this package
 * enforces. Every class the scanner encounters is resolved to
 * exactly one {@see LayerType} value; every rule reasons about
 * allowed / forbidden combinations of these values.
 *
 * ## The layering contract
 *
 *     Controller  →  Service / Action  →  Repository  →  Model
 *
 *   - **Controller** — request adapter. Allowed to inject Services
 *     and Actions. NOT allowed to touch Models directly, and
 *     (when strict mode is on) NOT allowed to touch Repositories
 *     directly.
 *
 *   - **Service** — orchestrator. Allowed to inject Repositories,
 *     other Services, and Actions. NOT allowed to touch Models.
 *
 *   - **Action** — invokable "one thing" — semantically a Service
 *     narrowed to a single method. Same allow/deny rules as
 *     Service.
 *
 *   - **Repository** — the ONLY layer that imports Model classes.
 *     Every persistence query, mutation, and eager-load lives
 *     behind a repository.
 *
 *   - **Model** — Eloquent record. Referenced by Repositories,
 *     Factories, Seeders, Migrations, and other Models
 *     (relationships). Never by anything else.
 *
 *   - **Infrastructure** — everything the app depends on that
 *     isn't domain code: middleware, service providers,
 *     console commands, factories, seeders, migrations,
 *     policies, observers, notifications, broadcasting channels.
 *     Some of these are allow-listed for direct Model access
 *     (Factories, Seeders); others aren't.
 *
 *   - **Test** — files under `tests/`. Allowed to touch anything.
 *
 *   - **Unknown** — the resolver couldn't classify. Rules that
 *     see `Unknown` should default to permissive to avoid false
 *     positives on tooling / build-generated code.
 *
 * @see \Academorix\Architecture\Support\LayerResolver Resolver.
 */

declare(strict_types=1);

namespace Academorix\Architecture\Enums;

use Academorix\Enum\Enum;

/**
 * The canonical set of architectural layers.
 *
 * The string values are used verbatim in configuration, in
 * violation messages, and in the CLI reporter output — treat them
 * as public API.
 */
enum LayerType: string
{
    use Enum;

    /** Eloquent (or attribute-marked) domain model. */
    case Model = 'model';

    /** Data-access layer — repositories that own model queries. */
    case Repository = 'repository';

    /** Business-logic orchestrator. */
    case Service = 'service';

    /** Single-purpose invokable service. */
    case Action = 'action';

    /** HTTP / GraphQL / CLI request adapter. */
    case Controller = 'controller';

    /**
     * Everything that isn't domain code but still lives in the
     * app: providers, middleware, observers, policies, jobs,
     * events, listeners, notifications, factories, seeders,
     * migrations.
     */
    case Infrastructure = 'infrastructure';

    /** Files under a test root. */
    case Test = 'test';

    /**
     * Sentinel value when the resolver couldn't classify. Rules
     * treat `Unknown` as unrestricted to keep the tool
     * conservative — false positives are more damaging than
     * false negatives for a lint that runs in CI.
     */
    case Unknown = 'unknown';

    /**
     * Human-readable label for reporter output. Uppercased first
     * letter, matches the case-name.
     */
    public function label(): string
    {
        return $this->name;
    }
}
