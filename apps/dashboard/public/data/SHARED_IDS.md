# Shared ID Registry — Mock Data

> Canonical list of every ID prefix and every ID that crosses file boundaries.
> Read this **before** adding new records. Do not invent IDs that collide with
> anything below. Do not invent new prefixes without adding them here first.

## 1. ID Format Rules

- Lowercase, snake_case, ASCII only.
- Format: `<prefix>_<slug-or-scoped-key>`.
- The `<prefix>` is a stable 2–5 character token identifying the resource type.
- The `<slug>` describes the record in words, not a random UUID. Mocks are read
  by humans; keep them recognizable. Example: `ath_emma`, `inv_1001`,
  `sc_liam_pack_1`.
- No PII in the slug beyond first names of demo athletes/guardians.
- If a record represents a specific date, embed the date as `YYYYMMDD` (e.g.
  `ar_liam_20260602`).

## 2. Prefix Registry

### Platform & tenancy

| Prefix     | Resource            | File                      | Example                                     |
| ---------- | ------------------- | ------------------------- | ------------------------------------------- |
| `tnt_`     | Tenant              | tenants.json              | `tnt_riverside`                             |
| `bt_`      | Business Type       | business-types.json       | `bt_academy`                                |
| `dom_`     | Tenant Domain       | tenants.json              | `dom_riverside_primary`                     |
| `org_`     | Organization        | organizations.json        | `org_riverside`, `org_downtown`             |
| `brn_`     | Branch              | branches.json             | `brn_river`, `brn_marina`, `brn_downtown`   |
| `reg_`     | Region              | regions.json              | `reg_us_east`                               |
| `ssn_`     | Season              | seasons.json              | `ssn_2025_26`, `ssn_2026_27`, `ssn_2024_25` |
| `rw_`      | Registration Window | registration-windows.json | `rw_2526_main`, `rw_2627_main`              |
| `agp_`     | Age Group           | age-groups.json           | `agp_river_u12`, `agp_marina_u10`           |
| `agerule_` | Age Cutoff Rule     | age-cutoff-rules.json     | `agerule_2526_u12_football`                 |

### Identity & access

| Prefix       | Resource                  | File               | Example                                                         |
| ------------ | ------------------------- | ------------------ | --------------------------------------------------------------- |
| `usr_`       | User                      | users.json         | `usr_owner`, `usr_admin`, `usr_coach_mike`, `usr_guardian_emma` |
| `pcp_`       | Person Identity (central) | people.json        | `pcp_alex_rivera`, `pcp_emma_johnson`                           |
| `role_`      | Role                      | roles.json         | `role_owner`, `role_coach`                                      |
| `perm_`      | Permission                | permissions.json   | `perm_athletes.create`                                          |
| `grant_`     | Scoped Grant              | grants.json        | `grant_owner_tenant`                                            |
| `sess_`      | Session                   | sessions.json      | `sess_owner_current`                                            |
| `inv_link_`  | Invitation                | invitations.json   | `inv_link_coach_dana`                                           |
| `apik_`      | API Key                   | api-keys.json      | `apik_pos_terminal`                                             |
| `mfa_`       | MFA Method                | mfa-methods.json   | `mfa_owner_totp`                                                |
| `log_login_` | Login History Entry       | login-history.json | `log_login_owner_20260630`                                      |
| `aud_`       | Audit Entry               | audits.json        | `aud_20260629_role_change`                                      |

### People (sports actors)

| Prefix     | Resource              | File                     | Example                                                  |
| ---------- | --------------------- | ------------------------ | -------------------------------------------------------- |
| `ath_`     | Athlete               | athletes.json            | `ath_emma`, `ath_liam`, `ath_olivia`                     |
| `stf_`     | Staff Profile         | staff.json               | `stf_coach_mike`, `stf_coach_marco`, `stf_reception_amy` |
| `cch_`     | Coach (sports view)   | coaches.json             | `cch_mike`, `cch_sara`, `cch_marco`                      |
| `ag_`      | Athlete-Guardian Link | athlete-guardians.json   | `ag_emma_mother`, `ag_olivia_step`                       |
| `aen_`     | Athlete-Enrollment    | athlete-enrollments.json | `aen_emma_football`, `aen_noah_swimming`                 |
| `atrf_`    | Athlete Transfer      | athlete-transfers.json   | `atrf_liam_team_swap`                                    |
| `strf_`    | Staff Transfer        | staff-transfers.json     | `strf_mike_lead_promo`                                   |
| `cass_`    | Coach Assignment      | coach-assignments.json   | `cass_mike_u12`                                          |
| `cav_`     | Coach Availability    | coach-availability.json  | `cav_mike_mon`                                           |
| `cn_`      | Coach Note            | coach-notes.json         | `cn_emma_finishing_20260601`                             |
| `cs_`      | Certification (Staff) | certifications.json      | `cs_mike_uefa_b`, `cs_sara_asa_l2`                       |
| `stf_doc_` | Staff Document        | staff-documents.json     | `stf_doc_marco_visa`                                     |
| `stf_pay_` | Staff Pay Rate        | staff-pay-rates.json     | `stf_pay_marco_session`                                  |
| `bgc_`     | Background Check      | background-checks.json   | `bgc_mike_dbs_2025`                                      |

### Sports structure

| Prefix   | Resource             | File                         | Example                                                              |
| -------- | -------------------- | ---------------------------- | -------------------------------------------------------------------- |
| `spt_`   | Sport                | sports.json                  | `spt_football`, `spt_swimming`                                       |
| `tsp_`   | Tenant Sport Overlay | tenant-sports.json           | `tsp_riverside_football`                                             |
| `tm_`    | Team                 | teams.json                   | `tm_river_u12`, `tm_river_u12_dev`, `tm_river_swim`, `tm_marina_u10` |
| `tmm_`   | Team Member          | team-members.json            | `tmm_river_u12_emma`                                                 |
| `frm_`   | Formation            | formations.json              | `frm_u12_442`                                                        |
| `atset_` | Attribute Set        | attribute-sets.json          | `atset_football_athlete_v1`                                          |
| `attr_`  | Attribute Definition | attributes.json (if created) | `attr_pace`                                                          |

### Scheduling & participation

| Prefix            | Resource                | File                              | Example                                                      |
| ----------------- | ----------------------- | --------------------------------- | ------------------------------------------------------------ |
| `evt_`            | Event                   | events.json                       | `evt_u12_training_1`, `evt_summer_festival`                  |
| `evinv_`          | Event Invitation        | event-invitations.json            | `evinv_evt1_emma`                                            |
| `evrem_`          | Event Reminder          | event-reminders.json (new)        | `evrem_evt1_24h`                                             |
| `evtm_`           | Event Team (multi-team) | event-teams.json                  | `evtm_festival_river`                                        |
| `cal_sub_`        | Calendar Subscription   | calendar-subscriptions.json (new) | `cal_sub_emma_all`                                           |
| `trn_`            | Training Session        | training-sessions.json            | `trn_1`, `trn_2`, `trn_swim_1`, `trn_marina_1`               |
| `mat_`            | Match (approved)        | matches.json                      | `mat_1`, `mat_4_marina_festival`                             |
| `mch_`            | Match (draft/informal)  | matches.json                      | `mch_u12_friendly`                                           |
| `msq_`            | Match Squad Entry       | match-squad.json                  | `msq_mat1_liam`                                              |
| `mres_`           | Match Result            | match-results.json (new)          | `mres_mat_1`                                                 |
| `ps_`             | Private Session         | private-sessions.json             | `ps_1`, `ps_2`, `ps_3_noshow`                                |
| `att_`            | Attendance Record       | attendance.json                   | `att_emma_trn2`, `att_noah_swim1`                            |
| `att_submission_` | Attendance Submission   | attendance-submissions.json       | `att_submission_u10_20260629`, `att_submission_u12_20260706` |
| `fac_`            | Facility/Resource       | facilities.json                   | `fac_river_pitch_1`, `fac_river_pool_1`                      |
| `rb_`             | Resource Booking        | resource-bookings.json            | `rb_pitch1_mat_1`                                            |
| `gt_`             | Gate/Reader             | gates.json                        | `gt_river_main`                                              |
| `crd_`            | Credential (NFC/RFID)   | credentials.json                  | `crd_emma_wristband`                                         |
| `ckl_`            | Check-in Log            | checkin-logs.json                 | `ckl_river_gt1_20260628`                                     |

### Development & performance

| Prefix      | Resource               | File                      | Example                                  |
| ----------- | ---------------------- | ------------------------- | ---------------------------------------- |
| `ar_`       | Assessment Record      | assessment-records.json   | `ar_emma_20260601`, `ar_olivia_20260612` |
| `tb_`       | Test Battery           | test-batteries.json       | `tb_football_preseason_v1`               |
| `tr_`       | Test Result            | test-results.json         | `tr_emma_preseason_20250910`             |
| `bench_`    | Benchmark              | benchmarks.json (new)     | `bench_u12_sprint_40m`                   |
| `dp_`       | Development Pathway    | development-pathways.json | `dp_football_elite`                      |
| `pws_`      | Pathway Stage          | pathway-stages.json       | `pws_foundation_u12`, `pws_youth_dev`    |
| `sr_scout_` | Scouting Report        | scouting-reports.json     | `sr_scout_trialist_kai`                  |
| `tf_`       | Talent Flag            | talent-flags.json         | `tf_liam_striker`                        |
| `gl_`       | Development Goal (IDP) | goals.json                | `gl_emma_weakfoot`                       |
| `mrec_`     | Medical Record         | medical-records.json      | `mrec_emma_baseline`                     |
| `inj_`      | Injury                 | injuries.json             | `inj_liam_ankle`                         |
| `trt_`      | Treatment              | treatments.json (new)     | `trt_liam_ankle_physio_1`                |
| `mc_`       | Medical Clearance      | medical-clearances.json   | `mc_sofia_rtp_202605`                    |

### Coaching content

| Prefix  | Resource          | File                                   | Example                                                                                     |
| ------- | ----------------- | -------------------------------------- | ------------------------------------------------------------------------------------------- |
| `drl_`  | Drill             | drills.json                            | `drl_passing_diamond`                                                                       |
| `dcat_` | Drill Category    | drills.json (or drill-categories.json) | `dcat_passing`                                                                              |
| `sp_`   | Session Plan      | session-plans.json                     | `sp_u12_passing_thurs`                                                                      |
| `spi_`  | Session Plan Item | session-plans.json                     | `spi_sp_u12_1`                                                                              |
| `curr_` | Curriculum        | curriculums.json                       | `curr_u12_autumn` (legacy prefix `cur_` also present — do not add new records under `cur_`) |
| `curw_` | Curriculum Week   | curriculum-weeks.json (new)            | `curw_u12_autumn_w1`                                                                        |

### Competition

| Prefix  | Resource            | File                      | Example                      |
| ------- | ------------------- | ------------------------- | ---------------------------- |
| `comp_` | Competition         | competitions.json         | `comp_u12_league`            |
| `cfx_`  | Competition Fixture | competition-fixtures.json | `cfx_u12_r1_river_vs_eagles` |
| `sr_`   | Standing Row        | standing-rows.json        | `sr_u12_river`               |
| `bn_`   | Bracket Node        | bracket-nodes.json        | `bn_u12_qf_1`                |

### Commerce & finance

| Prefix     | Resource                         | File                         | Example                                      |
| ---------- | -------------------------------- | ---------------------------- | -------------------------------------------- |
| `inv_`     | Invoice                          | invoices.json                | `inv_1001`, `inv_ps_emma_1`, `inv_ps_liam_1` |
| `pay_`     | Payment                          | payments.json                | `pay_1001`, `pay_1006`                       |
| `refund_`  | Refund                           | refunds.json                 | `refund_1003`                                |
| `cm_`      | Credit Memo                      | credit-memos.json            | `cm_emma_goodwill`, `cm_noah_partial`        |
| `cb_`      | Chargeback                       | chargebacks.json             | `cb_1004`                                    |
| `txn_`     | Ledger Transaction               | transactions.json            | `txn_001`–`txn_010`                          |
| `pm_`      | Payment Method (saved card)      | payment-methods.json         | `pm_emma_visa`, `pm_noah_visa`               |
| `mp_`      | Membership Plan                  | membership-plans.json        | `mp_football_u10_monthly`, `mp_swim_termly`  |
| `mem_`     | Membership                       | memberships.json             | `mem_emma_football`, `mem_noah_football`     |
| `sc_`      | Session Credit Ledger            | session-credits.json         | `sc_001`–`sc_006`, `sc_liam_pack_1`          |
| `pack_`    | Session Pack Definition          | packs.json                   | `pack_private_10`, `pack_swim_10`            |
| `sdr_`     | Sibling Discount Rule            | sibling-discount-rules.json  | `sdr_two_kids_ten_percent`                   |
| `fibnd_`   | Family Invoice Bundle            | family-invoice-bundles.json  | `fibnd_emma_family_202607`                   |
| `tpa_`     | Tenant Payment Account (Connect) | tenant-payment-accounts.json | `tpa_riverside_stripe`                       |
| `gev_`     | Gateway Event (webhook)          | gateway-events.json          | `gev_001` (was `gwevt_` in an earlier draft) |
| `invrem_`  | Invoice Reminder                 | invoice-reminders.json       | `invrem_inv1003_step3`                       |
| `exp_`     | Expense                          | expenses.json                | `exp_1`–`exp_5`                              |
| `expcat_`  | Expense Category                 | expense-categories.json      | `expcat_rent` (or `cat_rent`)                |
| `pyrn_`    | Payroll Run                      | payroll-runs.json (new)      | `pyrn_202606_riverside`                      |
| `pyrl_`    | Payroll Line                     | payroll-lines.json (new)     | `pyrl_pyrn_202606_marco`                     |
| `stf_bon_` | Staff Bonus                      | staff-bonuses.json (new)     | `stf_bon_mike_win_202606`                    |
| `stf_lv_`  | Staff Leave                      | staff-leave.json (new)       | `stf_lv_sara_summer_2026`                    |

### Communication

| Prefix   | Resource                 | File                          | Example                                                |
| -------- | ------------------------ | ----------------------------- | ------------------------------------------------------ |
| `conv_`  | Conversation             | conversations.json            | `conv_emma_coach`                                      |
| `msg_`   | Message                  | messages.json                 | `msg_conv_emma_1`                                      |
| `ann_`   | Announcement             | announcements.json            | `ann_summer_camp`                                      |
| `tpl_`   | Notification Template    | notification-templates.json   | `tpl_invite_push_en` (was `ntpl_` in an earlier draft) |
| `notif_` | Notification (delivered) | notifications.json (new)      | `notif_emma_lineup_20260628`                           |
| `npref_` | Notification Preference  | notification-preferences.json | `npref_emma_push_only`                                 |

### Enrollment funnel

| Prefix   | Resource       | File                   | Example                                        |
| -------- | -------------- | ---------------------- | ---------------------------------------------- |
| `reg_`   | Registration   | registrations.json     | `reg_olivia`, `reg_2627_kai`, `reg_2627_jenna` |
| `wl_`    | Waitlist Entry | waitlist-entries.json  | `wl_2627_u12_1`                                |
| `offer_` | Offer          | offers.json (new)      | `offer_wl_jenna`                               |
| `tt_`    | Team Trial     | team-trials.json (new) | `tt_olivia_20260614`                           |
| `lead_`  | Lead (CRM)     | leads.json             | `lead_carter`, `lead_okafor`                   |
| `task_`  | Follow-up Task | tasks.json (new)       | `task_carter_callback`                         |

### Reception / approvals / documents

| Prefix      | Resource               | File                               | Example                                            |
| ----------- | ---------------------- | ---------------------------------- | -------------------------------------------------- |
| `apt_`      | Approval Task          | approval-tasks.json                | `apt_reg_olivia`, `apt_transfer_liam`              |
| `rv_`       | Reception Visit        | reception-visits.json (new)        | `rv_walkin_20260625`                               |
| `dp_`       | Day Pass               | day-passes.json (new)              | `dp_river_20260625_1`                              |
| `doc_`      | Document / Media       | documents.json                     | `doc_ath_emma_medical`, `doc_expense_rent_receipt` |
| `ath_doc_`  | Athlete Document       | athlete-documents.json             | `ath_doc_emma_passport`                            |
| `cns_`      | Consent                | consents.json (new)                | `cns_emma_photo_2025`                              |
| `pack_ack_` | Policy Acknowledgement | policy-acknowledgements.json (new) | `pack_ack_mike_safeguarding_v2`                    |

### Safeguarding

| Prefix | Resource              | File                        | Example                                  |
| ------ | --------------------- | --------------------------- | ---------------------------------------- |
| `sg_`  | Safeguarding Incident | safeguarding-incidents.json | `sg_liam_welfare`, `sg_privacy_incident` |

### Awards

| Prefix  | Resource        | File              | Example                             |
| ------- | --------------- | ----------------- | ----------------------------------- |
| `awt_`  | Award Type      | award-types.json  | `awt_motm`, `awt_attendance_streak` |
| `aw_`   | Award (granted) | awards.json       | `aw_liam_motm_mat1`                 |
| `cert_` | Certificate     | certificates.json | `cert_liam_term1_2026`              |

### Subscription & entitlements (platform)

| Prefix  | Resource            | File                      | Example                     |
| ------- | ------------------- | ------------------------- | --------------------------- |
| `sub_`  | Subscription        | subscription.json         | `sub_riverside`             |
| `plan_` | Plan Tier           | plan-grants.json          | `plan_pro`, `plan_scale`    |
| `pgr_`  | Plan Grant          | plan-grants.json          | `pgr_pro_organization_slot` |
| `ent_`  | Entitlement License | entitlement-licenses.json | `ent_riverside_ai_tokens`   |

### Feature flags

| Prefix  | Resource                | File                       | Example                 |
| ------- | ----------------------- | -------------------------- | ----------------------- |
| `ff_`   | Feature Flag Definition | features.json              | `ff_facility_booking`   |
| `ffov_` | Feature Override        | feature-overrides.json     | `ffov_riverside_ai_on`  |
| `ffrl_` | Feature Rollout         | feature-rollouts.json      | `ffrl_ai_ga_2026`       |
| `ffks_` | Feature Kill Switch     | feature-kill-switches.json | `ffks_ai_emergency_off` |

### Integrations & webhooks

| Prefix   | Resource               | File                          | Example                        |
| -------- | ---------------------- | ----------------------------- | ------------------------------ |
| `integ_` | Integration Connection | integrations.json             | `integ_riverside_quickbooks`   |
| `wh_`    | Webhook Endpoint       | webhook-endpoints.json (new)  | `wh_riverside_zapier`          |
| `whd_`   | Webhook Delivery       | webhook-deliveries.json (new) | `whd_wh1_evt_charge_succeeded` |

### GDPR / lifecycle

| Prefix | Resource         | File                          | Example           |
| ------ | ---------------- | ----------------------------- | ----------------- |
| `ret_` | Retention Policy | retention-policies.json (new) | `ret_athletes_5y` |
| `era_` | Erasure Request  | erasure-requests.json (new)   | `era_mason_2025`  |

### Sync (offline)

| Prefix       | Resource        | File                | Example                    |
| ------------ | --------------- | ------------------- | -------------------------- |
| `sync_cur_`  | Sync Cursor     | sync-cursors.json   | `sync_cur_mike_attendance` |
| `sync_conf_` | Sync Conflict   | sync-conflicts.json | `sync_conf_att_emma_dup`   |
| `sync_q_`    | Sync Queue Item | sync-queue.json     | `sync_q_mike_att_emma`     |

### AI (new)

| Prefix    | Resource        | File                        | Example                     |
| --------- | --------------- | --------------------------- | --------------------------- |
| `aiconv_` | AI Conversation | ai-conversations.json (new) | `aiconv_mike_recap_202606`  |
| `airun_`  | AI Run          | ai-runs.json (new)          | `airun_aiconv_mike_1`       |
| `aitc_`   | AI Tool Call    | ai-tool-calls.json (new)    | `aitc_airun1_find_athlete`  |
| `aiemb_`  | AI Embedding    | ai-embeddings.json (new)    | `aiemb_drl_passing_diamond` |

### Reporting

| Prefix    | Resource          | File                          | Example                     |
| --------- | ----------------- | ----------------------------- | --------------------------- |
| `rptdef_` | Report Definition | report-definitions.json (new) | `rptdef_monthly_attendance` |
| `rpt_`    | Saved Report      | saved-reports.json (new)      | `rpt_river_may_attendance`  |

### Digital passes

| Prefix  | Resource    | File        | Example                |
| ------- | ----------- | ----------- | ---------------------- |
| `pass_` | Wallet Pass | passes.json | `pass_emma_membership` |

### Public site

| Prefix | Resource      | File             | Example         |
| ------ | ------------- | ---------------- | --------------- |
| `pg_`  | Public Page   | public-site.json | `pg_landing`    |
| `blk_` | Content Block | public-site.json | `blk_hero_home` |

### Opponent logos (Match)

| Prefix | Resource            | File                      | Example         |
| ------ | ------------------- | ------------------------- | --------------- |
| `opl_` | Opponent Logo Cache | opponent-logos.json (new) | `opl_rovers_fc` |

---

## 3. Canonical Cross-Cutting IDs

These IDs are referenced from ≥2 files. Sub-agents must not overload them.

### Tenants / structural

| ID                     | Meaning                                                            |
| ---------------------- | ------------------------------------------------------------------ |
| `tnt_riverside`        | The one tenant used across every file                              |
| `tnt_harbor`           | Second tenant referenced via cross-academy link (people.json only) |
| `tnt_external_seaside` | Third tenant (referenced from athlete-transfers.json)              |
| `org_riverside`        | Default org                                                        |
| `org_downtown`         | Second org (Marco's assignment)                                    |
| `brn_river`            | Primary branch                                                     |
| `brn_marina`           | Secondary branch                                                   |
| `brn_downtown`         | Third branch                                                       |
| `reg_us_east`          | Only region in mock set                                            |
| `ssn_2025_26`          | Active season                                                      |
| `ssn_2026_27`          | Upcoming season                                                    |
| `ssn_2024_25`          | Closed season                                                      |
| `bt_academy`           | Business type on tnt_riverside                                     |

### Users

| ID                           | Meaning                                            | Role                       |
| ---------------------------- | -------------------------------------------------- | -------------------------- |
| `usr_owner`                  | Alex Rivera                                        | owner                      |
| `usr_admin`                  | Dana Whitfield                                     | admin                      |
| `usr_coach_mike`             | Mike Turner                                        | head_coach                 |
| `usr_coach_sara`             | Sara Nolan                                         | coach                      |
| `usr_coach_marco`            | Marco Ferrari                                      | coach                      |
| `usr_reception_amy`          | Amy Lopez                                          | reception                  |
| `usr_finance_omar`           | Omar Haddad                                        | finance                    |
| `usr_medical_nadia`          | Nadia Farouk                                       | medical                    |
| `usr_guardian_emma`          | Dana Johnson (Emma's mother, Sofia's guardian too) | parent_guardian            |
| `usr_guardian_emma_father`   | Michael Johnson (Emma's father)                    | parent_guardian            |
| `usr_guardian_noah`          | Jason Williams (Noah's father, Ava's guardian too) | parent_guardian            |
| `usr_guardian_liam`          | Marta Garcia                                       | parent_guardian            |
| `usr_guardian_sofia`         | Elena Martinez                                     | parent_guardian            |
| `usr_guardian_ava`           | Christopher Brown                                  | parent_guardian            |
| `usr_guardian_mason`         | Patricia Davis                                     | parent_guardian (inactive) |
| `usr_guardian_olivia_mother` | Wei Chen                                           | parent_guardian            |
| `usr_guardian_olivia_step`   | Daniel Chen                                        | parent_guardian            |

### Athletes

| ID           | Meaning                                         |
| ------------ | ----------------------------------------------- |
| `ath_emma`   | Emma Johnson, U12 Football + Swimming           |
| `ath_liam`   | Liam Garcia, U12 Football (injured)             |
| `ath_sofia`  | Sofia Martinez, U10 Football (pending)          |
| `ath_noah`   | Noah Williams, U14 Swimming (Marina)            |
| `ath_ava`    | Ava Brown, Marina (inactive)                    |
| `ath_mason`  | Mason Davis (archived — transferred to Seaside) |
| `ath_olivia` | Olivia Chen (trial)                             |

### Staff / Coaches

| ID                              | Meaning                                |
| ------------------------------- | -------------------------------------- |
| `stf_coach_mike` (`cch_mike`)   | Head football coach, salaried          |
| `stf_coach_sara` (`cch_sara`)   | Swim coach, hourly                     |
| `stf_coach_marco` (`cch_marco`) | Football/basketball coach, per-session |
| `stf_reception_amy`             | Front desk (onboarding)                |
| `stf_medical_nadia`             | Medical officer                        |

### Teams

| ID                 | Meaning                         |
| ------------------ | ------------------------------- |
| `tm_river_u12`     | U12 Falcons                     |
| `tm_river_u12_dev` | U12 Falcons Development         |
| `tm_river_swim`    | Junior Swim Squad               |
| `tm_marina_u10`    | U10 Sharks                      |
| `tm_ext_eagles`    | External team — Eastside Eagles |
| `tm_ext_harbor`    | External team — Harbor FC       |
| `tm_ext_central`   | External team — Central United  |

### Facilities

| ID                  | Meaning                    |
| ------------------- | -------------------------- |
| `fac_river_pitch_1` | Main pitch at Riverside HQ |
| `fac_river_pool_1`  | Pool 1                     |

### Finance

| ID                                                  | Meaning                                           |
| --------------------------------------------------- | ------------------------------------------------- |
| `inv_1001`–`inv_1006`                               | Standard invoices                                 |
| `inv_ps_emma_1` / `inv_ps_liam_1` / `inv_ps_noah_1` | Private-session invoices                          |
| `pay_1001` / `pay_1003` / `pay_1004` / `pay_1006`   | Payments                                          |
| `refund_1003`                                       | Partial refund                                    |
| `cm_emma_goodwill` / `cm_noah_partial`              | Credit memos                                      |
| `cb_1004`                                           | Chargeback (reversed)                             |
| `txn_001`–`txn_010`                                 | Full transaction ledger                           |
| `pm_emma_visa` / `pm_noah_visa`                     | Saved cards                                       |
| `pack_private_10`                                   | 10-session football pack (source_id for inv_1006) |

### Memberships

| ID                                                                                                | Meaning |
| ------------------------------------------------------------------------------------------------- | ------- |
| `mem_emma_football` (active)                                                                      |
| `mem_olivia_swim` (active)                                                                        |
| `mem_noah_football` (past_due)                                                                    |
| `mem_ava_swim` (paused)                                                                           |
| `mem_sofia_football` (trialing)                                                                   |
| `mp_football_u10_monthly`, `mp_football_u14_termly`, `mp_swim_termly`, `mp_adult_fitness_monthly` |

### Sports / attribute sets

| ID                                                       | Meaning         |
| -------------------------------------------------------- | --------------- |
| `spt_football`, `spt_swimming`, `spt_basketball`         |
| `tsp_riverside_football`, `tsp_riverside_swimming`       |
| `frm_u12_442`                                            | 4-4-2 formation |
| `atset_football_athlete_v1`, `atset_swimming_athlete_v1` |

### Activities

| ID                                                                                                                                                    | Meaning |
| ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| `evt_u12_training_1`, `evt_u12_match_1`, `evt_swim_session_1`, `evt_summer_festival`, `evt_u12_training_cancelled`                                    |
| `mat_1` (completed), `mat_2` (scheduled with published lineup), `mat_3` (postponed), `mat_4_marina_festival` (multi-team), `mch_u12_friendly` (draft) |
| `trn_1`, `trn_2`, `trn_swim_1`, `trn_marina_1` (marina future)                                                                                        |
| `ps_1` (scheduled), `ps_2` (completed via credit), `ps_3_noshow` (no-show)                                                                            |

### Enrollment funnel

| ID                                                                                                               | Meaning |
| ---------------------------------------------------------------------------------------------------------------- | ------- |
| `reg_olivia` (trial), `reg_ethan` (lead), `reg_mia` (enrolled), `reg_sofia_converted` (enrolled)                 |
| `reg_2627_kai` (waitlisted), `reg_2627_jenna` (offered), `reg_2627_luca` (declined), `reg_2627_diego` (enrolled) |
| `wl_2627_u12_1`, `wl_2627_u12_2`, `wl_2627_swim_1`, `wl_2627_marina_u10`                                         |

### Approval tasks

| ID                                                                                                                                                                   | Meaning |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| `apt_reg_olivia`, `apt_doc_emma`, `apt_refund_noah`, `apt_match_u12`, `apt_attendance_u10`, `apt_link_request_emma_harbor`, `apt_transfer_liam`, `apt_transfer_noah` |

---

## 4. Reserved slots (do not use)

New sub-agents may create new IDs freely inside their assigned prefixes, but the
following prefixes are **reserved for the main integrator** and should not be
used by parallel workers unless explicitly stated in the agent brief:

- `aud_*` — Audit entries (only append to existing audits.json)
- `notif_*` — Notification feed
- `sub_*` — Platform subscription
- `plan_*` / `pgr_*` — Plan grants (only integrator adds new plans)
- `ent_*` — Entitlement licenses

## 5. When to invent a new prefix

Do not invent a new prefix without:

1. Adding it to §2 above.
2. Confirming no existing prefix already covers the concept.
3. Choosing a token that is 2–5 lowercase characters and does not collide.

## 6. Common relationship shortcuts

- Athlete guardians: `athlete_guardians.athlete_id → athletes.id` &
  `athlete_guardians.user_id → users.id`. Every guardian must exist in
  users.json.
- Payer relationship: `memberships.payer_user_id` / `invoices.payer_user_id` /
  `payments.payer_user_id` → the guardian user, **not** the athlete.
- Coaches: `coaches.staff_id → staff.id → staff.user_id → users.id`. Coach IDs
  (`cch_*`) and staff IDs (`stf_*`) parallel each other.
- Transactions: `transactions.parent_transaction_id` builds the lineage graph
  (charge → refund → chargeback → reversal → credit issue → credit apply).
- Attendance: individual records in `attendance.json` (`att_*`) roll up into
  submission batches in `attendance-submissions.json` (`att_submission_*`) via
  `linked_attendance_ids[]`.

---

_Last updated: 2026-07-02 · Owner: this repo · Version: 1_
