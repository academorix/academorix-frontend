# academorix-sports/medical

Server-side Laravel package for the `medical` module. Auto-generated from the
blueprint at `modules/sports/blueprints/medical/`.

## Entities

- **Allergy** (`alg_...`) — Allergen + severity + notes.
- **Injury** (`inj_...`) — Injury event — body_part / mechanism / severity /
  onset_at / status.
- **MedicalClearance** (`mcl_...`) — Clearance certificate that gates match
  squad selection.
- **MedicalRecord** (`mrc_...`) — Root health record per athlete — container
  aggregating Injury, Treatment, Clearance, Allergy, Medication.
- **Medication** (`med_...`) — Active medication — name / dosage / frequency /
  prescribing_provider / expires_at.
- **Treatment** (`trt_...`) — Treatment record linked to an Injury — provider /
  date / notes (encrypted) / follow_up_at.

## Layout

```
src/
├── Providers/                     # <Name>ServiceProvider (module boot)
├── Contracts/
│   ├── Data/*Interface.php        # TABLE + ATTR_* constants (#[Bind]-bound to Model)
│   └── Repositories/*Interface.php
├── Models/*.php                   # Eloquent, attribute-first
├── Repositories/*.php             # #[AsRepository] + #[UseModel]
├── Data/*.php                     # Spatie Data output DTOs
├── Policies/*.php                 # Wired via #[UsePolicy] on the Model
├── Events/*.php                   # Domain events (ShouldDispatchAfterCommit)
└── Actions/*.php                  # Single-invoke controllers (#[AsController])
database/
├── migrations/*.php
├── factories/*.php
└── seeders/*.php                  # (dual-source catalogues only)
tests/
├── Feature/
└── Unit/
```

## Regeneration

```bash
python3 modules/shared/blueprints/foundation/scripts/generate-module.py \
    sports medical --force
```

Files carrying the `AUTO-GENERATED` header are safe to regenerate; every other
file is a hand-tuned override that survives regeneration.

## Companion wire SDK

The wire-visible Saloon + Spatie Data package lives at
`academorix-sports/medical-sdk` under `sdk/sports-medical-sdk/`. Consumers cross
the service boundary through the SDK; this package is the SERVER-side owner of
the domain.
