# medical

Health records + return-to-play gating per blueprint §14.3. **Sensitive-data**
module — restricted RBAC (medical role + admin only), encrypted columns for PII,
GDPR-compliant export-before-delete.

## Owned entities

- `MedicalRecord` (`mrc_`) — root health record container per athlete.
- `Injury` (`inj_`) — reported → under_treatment → recovering → cleared.
- `Treatment` (`trt_`) — physio / medication / rehab / consult / imaging /
  surgery.
- `MedicalClearance` (`mcl_`) — cert with expires_at + scope; gates squad
  selection.
- `Allergy` (`alg_`) — allergen + severity; safe read for coaches.
- `Medication` (`med_`) — active meds; medical role restricted.

## The eligibility gate

`EligibilityGate::isEligible(athlete, session)` returns false when:

- The athlete has an active injury (status IN
  reported/under_treatment/recovering).
- The athlete's active MedicalClearance is expired or `scope=pending_review`.
- The MedicalClearance has restrictions incompatible with the session type.

Consumed by:

- `event` squad selection UI + write path
- `attendance` check-in (soft-blocks with medical override).

## Retention

- Injuries, treatments, clearances: 10 years post-athlete-archival (litigation
  hold horizon).
- Medications: 7 years post-discontinuation.
- Allergies: retained for the athlete's active lifetime; anonymised on erasure.

## ULID prefixes

- `mrc_`, `inj_`, `trt_`, `mcl_`, `alg_`, `med_`
