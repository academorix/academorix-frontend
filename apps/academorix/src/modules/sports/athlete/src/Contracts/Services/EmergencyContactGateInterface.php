<?php

declare(strict_types=1);

namespace Stackra\Athlete\Contracts\Services;

use Stackra\Athlete\Models\Athlete;
use Stackra\Athlete\Services\EmergencyContactGate;
use Illuminate\Container\Attributes\Bind;

/**
 * Contract for emergency-contact field READ authorisation.
 *
 * The three `emergency_contact_*` columns are PII (name + phone +
 * relationship). Unlike medical fields, they don't require a
 * separate consent flag — the fact that an athlete was registered
 * with an emergency contact is de-facto consent for staff to reach
 * them in an emergency. Access is still permission-gated.
 *
 * ## Authorisation policy
 *
 *   - **Coach on the athlete's team / staff / admin** with
 *     `athletes.view.emergency_contact` — allowed. This is the ONE
 *     path coaches have because they need the contact for on-field
 *     emergencies.
 *   - **Self / linked guardian** with `athletes.view.emergency_contact.own` —
 *     allowed.
 *   - Everyone else — denied. The output DTO drops the fields.
 *
 * The gate NEVER throws — it's read-side.
 *
 * @category Athlete
 *
 * @since    0.1.0
 */
#[Bind(EmergencyContactGate::class)]
interface EmergencyContactGateInterface
{
    /**
     * True when the caller may READ emergency-contact fields for the athlete.
     */
    public function canViewEmergencyContact(Athlete $athlete, ?string $viewerUserId): bool;

    /**
     * True when the caller may WRITE emergency-contact fields for the athlete.
     */
    public function canWriteEmergencyContact(Athlete $athlete, ?string $viewerUserId): bool;
}
