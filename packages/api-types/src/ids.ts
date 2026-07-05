/**
 * Branded ID types.
 *
 * Every resource has a stable string prefix (see `SHARED_IDS.md`). The
 * branded types below prevent silent cross-type mistakes: a function that
 * expects an `InvoiceId` will refuse an `AthleteId` even though both are
 * strings at runtime.
 *
 * Zod v4 exposes `.brand<'Foo'>()` — that lets us keep both the runtime
 * validator (prefix check) and the compile-time nominal type in one place.
 *
 * The prefix registry below mirrors `SHARED_IDS.md §2`. Grouping matches the
 * doc headings so an update in one place tracks the other.
 */

import { z } from "zod";

// -------- Brand factory --------

/**
 * Build a branded ID schema that:
 *   - is a string at runtime
 *   - must start with `<prefix>_`
 *   - carries a nominal brand tag for compile-time discrimination
 */
function idSchema<Brand extends string>(prefix: string, brand: Brand) {
  // Escape any regex metacharacters in the prefix. Prefixes are always plain
  // lowercase ASCII, so no metacharacters exist today, but we future-proof.
  const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  return z
    .string()
    .regex(new RegExp(`^${escaped}`), {
      message: `Expected ID to start with '${prefix}'`,
    })
    .brand<Brand>();
}

// -------- Platform & tenancy --------

export const TenantId = idSchema("tnt_", "TenantId");
export type TenantId = z.infer<typeof TenantId>;

export const BusinessTypeId = idSchema("bt_", "BusinessTypeId");
export type BusinessTypeId = z.infer<typeof BusinessTypeId>;

export const TenantDomainId = idSchema("dom_", "TenantDomainId");
export type TenantDomainId = z.infer<typeof TenantDomainId>;

export const OrganizationId = idSchema("org_", "OrganizationId");
export type OrganizationId = z.infer<typeof OrganizationId>;

export const BranchId = idSchema("brn_", "BranchId");
export type BranchId = z.infer<typeof BranchId>;

export const RegionId = idSchema("reg_", "RegionId");
export type RegionId = z.infer<typeof RegionId>;

export const SeasonId = idSchema("ssn_", "SeasonId");
export type SeasonId = z.infer<typeof SeasonId>;

export const RegistrationWindowId = idSchema("rw_", "RegistrationWindowId");
export type RegistrationWindowId = z.infer<typeof RegistrationWindowId>;

export const AgeGroupId = idSchema("agp_", "AgeGroupId");
export type AgeGroupId = z.infer<typeof AgeGroupId>;

export const AgeCutoffRuleId = idSchema("agerule_", "AgeCutoffRuleId");
export type AgeCutoffRuleId = z.infer<typeof AgeCutoffRuleId>;

// -------- Identity & access --------

export const UserId = idSchema("usr_", "UserId");
export type UserId = z.infer<typeof UserId>;

export const PersonIdentityId = idSchema("pcp_", "PersonIdentityId");
export type PersonIdentityId = z.infer<typeof PersonIdentityId>;

export const RoleId = idSchema("role_", "RoleId");
export type RoleId = z.infer<typeof RoleId>;

export const PermissionId = idSchema("perm_", "PermissionId");
export type PermissionId = z.infer<typeof PermissionId>;

export const GrantId = idSchema("grant_", "GrantId");
export type GrantId = z.infer<typeof GrantId>;

export const SessionId = idSchema("sess_", "SessionId");
export type SessionId = z.infer<typeof SessionId>;

export const InvitationId = idSchema("inv_link_", "InvitationId");
export type InvitationId = z.infer<typeof InvitationId>;

export const ApiKeyId = idSchema("apik_", "ApiKeyId");
export type ApiKeyId = z.infer<typeof ApiKeyId>;

export const MfaMethodId = idSchema("mfa_", "MfaMethodId");
export type MfaMethodId = z.infer<typeof MfaMethodId>;

export const LoginHistoryId = idSchema("log_login_", "LoginHistoryId");
export type LoginHistoryId = z.infer<typeof LoginHistoryId>;

export const AuditEntryId = idSchema("aud_", "AuditEntryId");
export type AuditEntryId = z.infer<typeof AuditEntryId>;

// -------- Sports actors --------

export const AthleteId = idSchema("ath_", "AthleteId");
export type AthleteId = z.infer<typeof AthleteId>;

export const StaffId = idSchema("stf_", "StaffId");
export type StaffId = z.infer<typeof StaffId>;

export const CoachId = idSchema("cch_", "CoachId");
export type CoachId = z.infer<typeof CoachId>;

export const AthleteGuardianId = idSchema("ag_", "AthleteGuardianId");
export type AthleteGuardianId = z.infer<typeof AthleteGuardianId>;

export const AthleteEnrollmentId = idSchema("aen_", "AthleteEnrollmentId");
export type AthleteEnrollmentId = z.infer<typeof AthleteEnrollmentId>;

export const AthleteTransferId = idSchema("atrf_", "AthleteTransferId");
export type AthleteTransferId = z.infer<typeof AthleteTransferId>;

export const StaffTransferId = idSchema("strf_", "StaffTransferId");
export type StaffTransferId = z.infer<typeof StaffTransferId>;

export const CoachAssignmentId = idSchema("cass_", "CoachAssignmentId");
export type CoachAssignmentId = z.infer<typeof CoachAssignmentId>;

export const CoachAvailabilityId = idSchema("cav_", "CoachAvailabilityId");
export type CoachAvailabilityId = z.infer<typeof CoachAvailabilityId>;

export const CoachNoteId = idSchema("cn_", "CoachNoteId");
export type CoachNoteId = z.infer<typeof CoachNoteId>;

export const CertificationId = idSchema("cs_", "CertificationId");
export type CertificationId = z.infer<typeof CertificationId>;

export const StaffDocumentId = idSchema("stf_doc_", "StaffDocumentId");
export type StaffDocumentId = z.infer<typeof StaffDocumentId>;

export const StaffPayRateId = idSchema("stf_pay_", "StaffPayRateId");
export type StaffPayRateId = z.infer<typeof StaffPayRateId>;

export const BackgroundCheckId = idSchema("bgc_", "BackgroundCheckId");
export type BackgroundCheckId = z.infer<typeof BackgroundCheckId>;

// -------- Sports structure --------

export const SportId = idSchema("spt_", "SportId");
export type SportId = z.infer<typeof SportId>;

export const TenantSportId = idSchema("tsp_", "TenantSportId");
export type TenantSportId = z.infer<typeof TenantSportId>;

export const TeamId = idSchema("tm_", "TeamId");
export type TeamId = z.infer<typeof TeamId>;

export const TeamMemberId = idSchema("tmm_", "TeamMemberId");
export type TeamMemberId = z.infer<typeof TeamMemberId>;

export const FormationId = idSchema("frm_", "FormationId");
export type FormationId = z.infer<typeof FormationId>;

export const AttributeSetId = idSchema("atset_", "AttributeSetId");
export type AttributeSetId = z.infer<typeof AttributeSetId>;

export const AttributeDefinitionId = idSchema("attr_", "AttributeDefinitionId");
export type AttributeDefinitionId = z.infer<typeof AttributeDefinitionId>;

// -------- Scheduling & participation --------

export const EventId = idSchema("evt_", "EventId");
export type EventId = z.infer<typeof EventId>;

export const EventInvitationId = idSchema("evinv_", "EventInvitationId");
export type EventInvitationId = z.infer<typeof EventInvitationId>;

export const EventReminderId = idSchema("evrem_", "EventReminderId");
export type EventReminderId = z.infer<typeof EventReminderId>;

export const EventTeamId = idSchema("evtm_", "EventTeamId");
export type EventTeamId = z.infer<typeof EventTeamId>;

export const CalendarSubscriptionId = idSchema("cal_sub_", "CalendarSubscriptionId");
export type CalendarSubscriptionId = z.infer<typeof CalendarSubscriptionId>;

export const TrainingSessionId = idSchema("trn_", "TrainingSessionId");
export type TrainingSessionId = z.infer<typeof TrainingSessionId>;

/**
 * Matches use two prefixes: `mat_` for approved fixtures and `mch_` for
 * drafts / informal games. We accept either.
 */
export const MatchId = z
  .string()
  .regex(/^(mat_|mch_)/, "Expected ID to start with 'mat_' or 'mch_'")
  .brand<"MatchId">();
export type MatchId = z.infer<typeof MatchId>;

export const MatchSquadId = idSchema("msq_", "MatchSquadId");
export type MatchSquadId = z.infer<typeof MatchSquadId>;

export const MatchResultId = idSchema("mres_", "MatchResultId");
export type MatchResultId = z.infer<typeof MatchResultId>;

export const PrivateSessionId = idSchema("ps_", "PrivateSessionId");
export type PrivateSessionId = z.infer<typeof PrivateSessionId>;

export const AttendanceId = idSchema("att_", "AttendanceId");
export type AttendanceId = z.infer<typeof AttendanceId>;

export const AttendanceSubmissionId = idSchema("att_submission_", "AttendanceSubmissionId");
export type AttendanceSubmissionId = z.infer<typeof AttendanceSubmissionId>;

export const FacilityId = idSchema("fac_", "FacilityId");
export type FacilityId = z.infer<typeof FacilityId>;

export const ResourceBookingId = idSchema("rb_", "ResourceBookingId");
export type ResourceBookingId = z.infer<typeof ResourceBookingId>;

export const GateId = idSchema("gt_", "GateId");
export type GateId = z.infer<typeof GateId>;

export const CredentialId = idSchema("crd_", "CredentialId");
export type CredentialId = z.infer<typeof CredentialId>;

export const CheckinLogId = idSchema("ckl_", "CheckinLogId");
export type CheckinLogId = z.infer<typeof CheckinLogId>;

// -------- Development & performance --------

export const AssessmentRecordId = idSchema("ar_", "AssessmentRecordId");
export type AssessmentRecordId = z.infer<typeof AssessmentRecordId>;

export const TestBatteryId = idSchema("tb_", "TestBatteryId");
export type TestBatteryId = z.infer<typeof TestBatteryId>;

export const TestResultId = idSchema("tr_", "TestResultId");
export type TestResultId = z.infer<typeof TestResultId>;

export const BenchmarkId = idSchema("bench_", "BenchmarkId");
export type BenchmarkId = z.infer<typeof BenchmarkId>;

/**
 * Development Pathway IDs. Note that `dp_` is also used for Day Passes in
 * `day-passes.json`; the two never appear in the same field. This schema
 * validates the prefix only — semantic disambiguation is left to the
 * consuming resource. See DayPassId below for the day-pass shape.
 */
export const DevelopmentPathwayId = idSchema("dp_", "DevelopmentPathwayId");
export type DevelopmentPathwayId = z.infer<typeof DevelopmentPathwayId>;

export const PathwayStageId = idSchema("pws_", "PathwayStageId");
export type PathwayStageId = z.infer<typeof PathwayStageId>;

export const ScoutingReportId = idSchema("sr_scout_", "ScoutingReportId");
export type ScoutingReportId = z.infer<typeof ScoutingReportId>;

export const TalentFlagId = idSchema("tf_", "TalentFlagId");
export type TalentFlagId = z.infer<typeof TalentFlagId>;

export const DevelopmentGoalId = idSchema("gl_", "DevelopmentGoalId");
export type DevelopmentGoalId = z.infer<typeof DevelopmentGoalId>;

/**
 * Medical record IDs. Fixture uses `med_` today; the historical registry
 * lists `mrec_`. Accept both so the validator doesn't break when either
 * prefix is used.
 */
export const MedicalRecordId = z
  .string()
  .regex(/^(mrec_|med_)/, "Expected ID to start with 'mrec_' or 'med_'")
  .brand<"MedicalRecordId">();
export type MedicalRecordId = z.infer<typeof MedicalRecordId>;

export const InjuryId = idSchema("inj_", "InjuryId");
export type InjuryId = z.infer<typeof InjuryId>;

export const TreatmentId = idSchema("trt_", "TreatmentId");
export type TreatmentId = z.infer<typeof TreatmentId>;

export const MedicalClearanceId = idSchema("mc_", "MedicalClearanceId");
export type MedicalClearanceId = z.infer<typeof MedicalClearanceId>;

// -------- Coaching content --------

export const DrillId = idSchema("drl_", "DrillId");
export type DrillId = z.infer<typeof DrillId>;

export const DrillCategoryId = idSchema("dcat_", "DrillCategoryId");
export type DrillCategoryId = z.infer<typeof DrillCategoryId>;

export const SessionPlanId = idSchema("sp_", "SessionPlanId");
export type SessionPlanId = z.infer<typeof SessionPlanId>;

export const SessionPlanItemId = idSchema("spi_", "SessionPlanItemId");
export type SessionPlanItemId = z.infer<typeof SessionPlanItemId>;

/**
 * Curriculum IDs. SHARED_IDS.md notes that `cur_` is a legacy prefix still in
 * some fixtures — accept both.
 */
export const CurriculumId = z
  .string()
  .regex(/^(curr_|cur_)/, "Expected ID to start with 'curr_' or 'cur_'")
  .brand<"CurriculumId">();
export type CurriculumId = z.infer<typeof CurriculumId>;

export const CurriculumWeekId = idSchema("curw_", "CurriculumWeekId");
export type CurriculumWeekId = z.infer<typeof CurriculumWeekId>;

// -------- Competition --------

export const CompetitionId = idSchema("comp_", "CompetitionId");
export type CompetitionId = z.infer<typeof CompetitionId>;

export const CompetitionFixtureId = idSchema("cfx_", "CompetitionFixtureId");
export type CompetitionFixtureId = z.infer<typeof CompetitionFixtureId>;

export const StandingRowId = idSchema("sr_", "StandingRowId");
export type StandingRowId = z.infer<typeof StandingRowId>;

export const BracketNodeId = idSchema("bn_", "BracketNodeId");
export type BracketNodeId = z.infer<typeof BracketNodeId>;

// -------- Commerce & finance --------

export const InvoiceId = idSchema("inv_", "InvoiceId");
export type InvoiceId = z.infer<typeof InvoiceId>;

export const PaymentId = idSchema("pay_", "PaymentId");
export type PaymentId = z.infer<typeof PaymentId>;

export const RefundId = idSchema("refund_", "RefundId");
export type RefundId = z.infer<typeof RefundId>;

export const CreditMemoId = idSchema("cm_", "CreditMemoId");
export type CreditMemoId = z.infer<typeof CreditMemoId>;

export const ChargebackId = idSchema("cb_", "ChargebackId");
export type ChargebackId = z.infer<typeof ChargebackId>;

export const LedgerTransactionId = idSchema("txn_", "LedgerTransactionId");
export type LedgerTransactionId = z.infer<typeof LedgerTransactionId>;

export const PaymentMethodId = idSchema("pm_", "PaymentMethodId");
export type PaymentMethodId = z.infer<typeof PaymentMethodId>;

export const MembershipPlanId = idSchema("mp_", "MembershipPlanId");
export type MembershipPlanId = z.infer<typeof MembershipPlanId>;

export const MembershipId = idSchema("mem_", "MembershipId");
export type MembershipId = z.infer<typeof MembershipId>;

export const SessionCreditId = idSchema("sc_", "SessionCreditId");
export type SessionCreditId = z.infer<typeof SessionCreditId>;

export const SessionPackId = idSchema("pack_", "SessionPackId");
export type SessionPackId = z.infer<typeof SessionPackId>;

export const SiblingDiscountRuleId = idSchema("sdr_", "SiblingDiscountRuleId");
export type SiblingDiscountRuleId = z.infer<typeof SiblingDiscountRuleId>;

export const FamilyInvoiceBundleId = idSchema("fibnd_", "FamilyInvoiceBundleId");
export type FamilyInvoiceBundleId = z.infer<typeof FamilyInvoiceBundleId>;

export const TenantPaymentAccountId = idSchema("tpa_", "TenantPaymentAccountId");
export type TenantPaymentAccountId = z.infer<typeof TenantPaymentAccountId>;

export const GatewayEventId = idSchema("gev_", "GatewayEventId");
export type GatewayEventId = z.infer<typeof GatewayEventId>;

export const InvoiceReminderId = idSchema("invrem_", "InvoiceReminderId");
export type InvoiceReminderId = z.infer<typeof InvoiceReminderId>;

export const ExpenseId = idSchema("exp_", "ExpenseId");
export type ExpenseId = z.infer<typeof ExpenseId>;

/**
 * Expense category prefix. SHARED_IDS.md notes both `expcat_` and `cat_` may
 * appear.
 */
export const ExpenseCategoryId = z
  .string()
  .regex(/^(expcat_|cat_)/, "Expected ID to start with 'expcat_' or 'cat_'")
  .brand<"ExpenseCategoryId">();
export type ExpenseCategoryId = z.infer<typeof ExpenseCategoryId>;

export const PayrollRunId = idSchema("pyrn_", "PayrollRunId");
export type PayrollRunId = z.infer<typeof PayrollRunId>;

export const PayrollLineId = idSchema("pyrl_", "PayrollLineId");
export type PayrollLineId = z.infer<typeof PayrollLineId>;

export const StaffBonusId = idSchema("stf_bon_", "StaffBonusId");
export type StaffBonusId = z.infer<typeof StaffBonusId>;

export const StaffLeaveId = idSchema("stf_lv_", "StaffLeaveId");
export type StaffLeaveId = z.infer<typeof StaffLeaveId>;

// -------- Communication --------

export const ConversationId = idSchema("conv_", "ConversationId");
export type ConversationId = z.infer<typeof ConversationId>;

export const MessageId = idSchema("msg_", "MessageId");
export type MessageId = z.infer<typeof MessageId>;

export const AnnouncementId = idSchema("ann_", "AnnouncementId");
export type AnnouncementId = z.infer<typeof AnnouncementId>;

/**
 * Notification template prefix. Historical dumps used `ntpl_`; current
 * fixture uses `tpl_`. Accept both.
 */
export const NotificationTemplateId = z
  .string()
  .regex(/^(tpl_|ntpl_)/, "Expected ID to start with 'tpl_' or 'ntpl_'")
  .brand<"NotificationTemplateId">();
export type NotificationTemplateId = z.infer<typeof NotificationTemplateId>;

export const NotificationId = idSchema("notif_", "NotificationId");
export type NotificationId = z.infer<typeof NotificationId>;

export const NotificationPreferenceId = idSchema("npref_", "NotificationPreferenceId");
export type NotificationPreferenceId = z.infer<typeof NotificationPreferenceId>;

// -------- Enrollment funnel --------

export const RegistrationId = idSchema("reg_", "RegistrationId");
export type RegistrationId = z.infer<typeof RegistrationId>;

export const WaitlistEntryId = idSchema("wl_", "WaitlistEntryId");
export type WaitlistEntryId = z.infer<typeof WaitlistEntryId>;

export const OfferId = idSchema("offer_", "OfferId");
export type OfferId = z.infer<typeof OfferId>;

export const TeamTrialId = idSchema("tt_", "TeamTrialId");
export type TeamTrialId = z.infer<typeof TeamTrialId>;

export const LeadId = idSchema("lead_", "LeadId");
export type LeadId = z.infer<typeof LeadId>;

export const TaskId = idSchema("task_", "TaskId");
export type TaskId = z.infer<typeof TaskId>;

// -------- Reception / approvals / documents --------

export const ApprovalTaskId = idSchema("apt_", "ApprovalTaskId");
export type ApprovalTaskId = z.infer<typeof ApprovalTaskId>;

export const ReceptionVisitId = idSchema("rv_", "ReceptionVisitId");
export type ReceptionVisitId = z.infer<typeof ReceptionVisitId>;

/**
 * DayPass IDs share the `dp_` prefix with DevelopmentPathwayId — see the note
 * on DevelopmentPathwayId above. This schema only validates the prefix.
 */
export const DayPassId = idSchema("dp_", "DayPassId");
export type DayPassId = z.infer<typeof DayPassId>;

export const DocumentId = idSchema("doc_", "DocumentId");
export type DocumentId = z.infer<typeof DocumentId>;

export const AthleteDocumentId = idSchema("ath_doc_", "AthleteDocumentId");
export type AthleteDocumentId = z.infer<typeof AthleteDocumentId>;

export const ConsentId = idSchema("cns_", "ConsentId");
export type ConsentId = z.infer<typeof ConsentId>;

export const PolicyAcknowledgementId = idSchema("pack_ack_", "PolicyAcknowledgementId");
export type PolicyAcknowledgementId = z.infer<typeof PolicyAcknowledgementId>;

// -------- Safeguarding --------

export const SafeguardingIncidentId = idSchema("sg_", "SafeguardingIncidentId");
export type SafeguardingIncidentId = z.infer<typeof SafeguardingIncidentId>;

// -------- Awards --------

export const AwardTypeId = idSchema("awt_", "AwardTypeId");
export type AwardTypeId = z.infer<typeof AwardTypeId>;

export const AwardId = idSchema("aw_", "AwardId");
export type AwardId = z.infer<typeof AwardId>;

export const CertificateId = idSchema("cert_", "CertificateId");
export type CertificateId = z.infer<typeof CertificateId>;

// -------- Subscription & entitlements --------

export const SubscriptionId = idSchema("sub_", "SubscriptionId");
export type SubscriptionId = z.infer<typeof SubscriptionId>;

export const PlanTierId = idSchema("plan_", "PlanTierId");
export type PlanTierId = z.infer<typeof PlanTierId>;

export const PlanGrantId = idSchema("pgr_", "PlanGrantId");
export type PlanGrantId = z.infer<typeof PlanGrantId>;

export const EntitlementLicenseId = idSchema("ent_", "EntitlementLicenseId");
export type EntitlementLicenseId = z.infer<typeof EntitlementLicenseId>;

// -------- Feature flags --------

export const FeatureFlagId = idSchema("ff_", "FeatureFlagId");
export type FeatureFlagId = z.infer<typeof FeatureFlagId>;

export const FeatureOverrideId = idSchema("ffov_", "FeatureOverrideId");
export type FeatureOverrideId = z.infer<typeof FeatureOverrideId>;

export const FeatureRolloutId = idSchema("ffrl_", "FeatureRolloutId");
export type FeatureRolloutId = z.infer<typeof FeatureRolloutId>;

export const FeatureKillSwitchId = idSchema("ffks_", "FeatureKillSwitchId");
export type FeatureKillSwitchId = z.infer<typeof FeatureKillSwitchId>;

// -------- Integrations & webhooks --------

export const IntegrationId = idSchema("integ_", "IntegrationId");
export type IntegrationId = z.infer<typeof IntegrationId>;

export const WebhookEndpointId = idSchema("wh_", "WebhookEndpointId");
export type WebhookEndpointId = z.infer<typeof WebhookEndpointId>;

export const WebhookDeliveryId = idSchema("whd_", "WebhookDeliveryId");
export type WebhookDeliveryId = z.infer<typeof WebhookDeliveryId>;

// -------- GDPR / lifecycle --------

export const RetentionPolicyId = idSchema("ret_", "RetentionPolicyId");
export type RetentionPolicyId = z.infer<typeof RetentionPolicyId>;

export const ErasureRequestId = idSchema("era_", "ErasureRequestId");
export type ErasureRequestId = z.infer<typeof ErasureRequestId>;

// -------- Sync (offline) --------

export const SyncCursorId = idSchema("sync_cur_", "SyncCursorId");
export type SyncCursorId = z.infer<typeof SyncCursorId>;

export const SyncConflictId = idSchema("sync_conf_", "SyncConflictId");
export type SyncConflictId = z.infer<typeof SyncConflictId>;

export const SyncQueueItemId = idSchema("sync_q_", "SyncQueueItemId");
export type SyncQueueItemId = z.infer<typeof SyncQueueItemId>;

// -------- AI --------

export const AiConversationId = idSchema("aiconv_", "AiConversationId");
export type AiConversationId = z.infer<typeof AiConversationId>;

export const AiRunId = idSchema("airun_", "AiRunId");
export type AiRunId = z.infer<typeof AiRunId>;

export const AiToolCallId = idSchema("aitc_", "AiToolCallId");
export type AiToolCallId = z.infer<typeof AiToolCallId>;

export const AiEmbeddingId = idSchema("aiemb_", "AiEmbeddingId");
export type AiEmbeddingId = z.infer<typeof AiEmbeddingId>;

// -------- Reporting --------

export const ReportDefinitionId = idSchema("rptdef_", "ReportDefinitionId");
export type ReportDefinitionId = z.infer<typeof ReportDefinitionId>;

export const SavedReportId = idSchema("rpt_", "SavedReportId");
export type SavedReportId = z.infer<typeof SavedReportId>;

// -------- Digital passes --------

export const WalletPassId = idSchema("pass_", "WalletPassId");
export type WalletPassId = z.infer<typeof WalletPassId>;

// -------- Public site --------

export const PublicPageId = idSchema("pg_", "PublicPageId");
export type PublicPageId = z.infer<typeof PublicPageId>;

export const ContentBlockId = idSchema("blk_", "ContentBlockId");
export type ContentBlockId = z.infer<typeof ContentBlockId>;

// -------- Opponent logos --------

export const OpponentLogoId = idSchema("opl_", "OpponentLogoId");
export type OpponentLogoId = z.infer<typeof OpponentLogoId>;

// -------- Global human-readable identity --------

/**
 * Academorix ID — the human-readable global identity of a Person. Format:
 * `AX-<3 letters>-<4 digits>`. Referenced from `people.json` and `me.json`.
 */
export const AcademorixId = z
  .string()
  .regex(/^AX-[A-Z]{3}-\d{4}$/, "Expected format 'AX-XXX-####'")
  .brand<"AcademorixId">();
export type AcademorixId = z.infer<typeof AcademorixId>;
