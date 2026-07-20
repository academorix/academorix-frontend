# medical — changelog

## [Unreleased] — inception (Wave 3)

- Six owned entities: MedicalRecord / Injury / Treatment / MedicalClearance /
  Allergy / Medication.
- Strict RBAC — medical role + admin only. Coaches see redacted allergy summary;
  never full medical detail.
- Encrypted columns for PII (notes, provider names, medication names, dosages)
  via `EncryptsSensitiveFields`.
- Eligibility gate blocks squad selection on active injury OR expired clearance.
- 10 published events including `ReturnToPlayCleared` (feeds analytics + coach
  notifications) and `ClearanceExpiring` (fires at 90/30/7d intervals).
- Retention: 10y post-archival (injuries/clearances); 7y post-discontinuation
  (medications).

### Dependencies

- `foundation`, `tenancy`, `application`, `athlete`, `athlete-enrollment`,
  `storage`, `notifications`, `compliance`.

### ULID prefixes

- `mrc_`, `inj_`, `trt_`, `mcl_`, `alg_`, `med_` — registered.
