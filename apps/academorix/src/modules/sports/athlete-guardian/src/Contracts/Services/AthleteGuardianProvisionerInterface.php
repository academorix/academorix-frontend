<?php

declare(strict_types=1);

namespace Academorix\AthleteGuardian\Contracts\Services;

use Academorix\AthleteGuardian\Models\AthleteGuardian;
use Academorix\AthleteGuardian\Services\AthleteGuardianProvisioner;
use Illuminate\Container\Attributes\Bind;

/**
 * Contract for the AthleteGuardian create-side orchestrator.
 *
 * Encapsulates the invariants that a plain repository write can't
 * enforce:
 *
 *   - Every guardian row lives inside a tenant scope. Cross-tenant
 *     writes are rejected.
 *   - Every athlete gets exactly ONE `is_primary = true` guardian at
 *     a time. Creating a "primary" row automatically flips the
 *     previous primary to non-primary inside the wrapping transaction.
 *   - Duplicate rows (same tenant, athlete, user) are refused with
 *     `GuardianDuplicateException` — the workflow is "update or
 *     revoke the existing row" not "create a second one".
 *   - The user_id must reference an active User row in the tenant.
 *   - Every guardian starts at `verification_status = Pending`. The
 *     `VerifyAction` is the ONE way to promote to Verified.
 *
 * @category AthleteGuardian
 *
 * @since    0.1.0
 */
#[Bind(AthleteGuardianProvisioner::class)]
interface AthleteGuardianProvisionerInterface
{
    /**
     * Persist a new AthleteGuardian row.
     *
     * @param  array<string, mixed>  $attributes  Column-keyed input from the
     *                                             validated request DTO.
     * @return AthleteGuardian  The persisted row.
     *
     * @throws \Academorix\AthleteGuardian\Exceptions\GuardianDuplicateException
     * @throws \Academorix\AthleteGuardian\Exceptions\GuardianAthleteAlreadyHasPrimaryException
     */
    public function provision(array $attributes): AthleteGuardian;
}
