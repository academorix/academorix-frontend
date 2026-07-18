/**
 * Closed enums used across the mock fixtures.
 *
 * These are derived empirically from the JSON data — each `values` array is
 * exactly the union observed in the fixtures. If a new state is introduced
 * (e.g. a new match status), it appears in the fixtures first; the build
 * script `scripts/generate-schemas.mjs` surfaces the drift so the enum below
 * can be updated in one place.
 *
 * Every enum exports:
 *   - `<Name>` — a zod schema (`z.enum([...])`)
 *   - `<Name>Values` — the value tuple (readable at runtime for
 *     e.g. option lists)
 *   - the TypeScript union type via `z.infer`
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Match / competition
// ---------------------------------------------------------------------------

export const MatchStatusValues = [
  "scheduled",
  "lineup_set",
  "in_progress",
  "completed",
  "postponed",
  "cancelled",
  "abandoned",
  "draft",
] as const;
export const MatchStatus = z.enum(MatchStatusValues);
export type MatchStatus = z.infer<typeof MatchStatus>;

export const CompetitionStatusValues = [
  "draft",
  "registration",
  "in_progress",
  "active",
  "completed",
  "archived",
] as const;
export const CompetitionStatus = z.enum(CompetitionStatusValues);
export type CompetitionStatus = z.infer<typeof CompetitionStatus>;

export const CompetitionFixtureStatusValues = [
  "scheduled",
  "completed",
  "postponed",
  "cancelled",
] as const;
export const CompetitionFixtureStatus = z.enum(CompetitionFixtureStatusValues);
export type CompetitionFixtureStatus = z.infer<typeof CompetitionFixtureStatus>;

export const BracketNodeStatusValues = ["pending", "scheduled", "completed"] as const;
export const BracketNodeStatus = z.enum(BracketNodeStatusValues);
export type BracketNodeStatus = z.infer<typeof BracketNodeStatus>;

// ---------------------------------------------------------------------------
// Athlete / person
// ---------------------------------------------------------------------------

export const AthleteStatusValues = ["active", "trial", "pending", "inactive", "archived"] as const;
export const AthleteStatus = z.enum(AthleteStatusValues);
export type AthleteStatus = z.infer<typeof AthleteStatus>;

export const UserStatusValues = ["active", "inactive", "pending_verification"] as const;
export const UserStatus = z.enum(UserStatusValues);
export type UserStatus = z.infer<typeof UserStatus>;

export const StaffStatusValues = ["active", "onboarding"] as const;
export const StaffStatus = z.enum(StaffStatusValues);
export type StaffStatus = z.infer<typeof StaffStatus>;

export const AthleteEnrollmentStatusValues = ["active", "trial"] as const;
export const AthleteEnrollmentStatus = z.enum(AthleteEnrollmentStatusValues);
export type AthleteEnrollmentStatus = z.infer<typeof AthleteEnrollmentStatus>;

export const AthleteTransferStatusValues = [
  "requested",
  "approved",
  "completed",
  "rejected",
] as const;
export const AthleteTransferStatus = z.enum(AthleteTransferStatusValues);
export type AthleteTransferStatus = z.infer<typeof AthleteTransferStatus>;

export const StaffTransferStatusValues = [
  "requested",
  "pending_approval",
  "approved",
  "completed",
] as const;
export const StaffTransferStatus = z.enum(StaffTransferStatusValues);
export type StaffTransferStatus = z.infer<typeof StaffTransferStatus>;

export const AthleteTransferKindValues = ["team", "branch", "academy"] as const;
export const AthleteTransferKind = z.enum(AthleteTransferKindValues);
export type AthleteTransferKind = z.infer<typeof AthleteTransferKind>;

export const StaffTransferKindValues = [
  "branch",
  "role_change",
  "promotion",
  "cross_tenant_release",
] as const;
export const StaffTransferKind = z.enum(StaffTransferKindValues);
export type StaffTransferKind = z.infer<typeof StaffTransferKind>;

// ---------------------------------------------------------------------------
// Membership / subscription
// ---------------------------------------------------------------------------

export const MembershipStatusValues = [
  "trialing",
  "active",
  "past_due",
  "paused",
  "canceled",
] as const;
export const MembershipStatus = z.enum(MembershipStatusValues);
export type MembershipStatus = z.infer<typeof MembershipStatus>;

export const SubscriptionStatusValues = [
  "trialing",
  "active",
  "past_due",
  "paused",
  "canceled",
] as const;
export const SubscriptionStatus = z.enum(SubscriptionStatusValues);
export type SubscriptionStatus = z.infer<typeof SubscriptionStatus>;

export const BillingPeriodValues = ["monthly", "termly", "annual"] as const;
export const BillingPeriod = z.enum(BillingPeriodValues);
export type BillingPeriod = z.infer<typeof BillingPeriod>;

// ---------------------------------------------------------------------------
// Finance / billing
// ---------------------------------------------------------------------------

export const InvoiceStatusValues = [
  "draft",
  "issued",
  "paid",
  "overdue",
  "partially_paid",
  "void",
] as const;
export const InvoiceStatus = z.enum(InvoiceStatusValues);
export type InvoiceStatus = z.infer<typeof InvoiceStatus>;

export const PaymentStatusValues = [
  "pending",
  "succeeded",
  "failed",
  "refunded",
  "partially_refunded",
] as const;
export const PaymentStatus = z.enum(PaymentStatusValues);
export type PaymentStatus = z.infer<typeof PaymentStatus>;

export const RefundStatusValues = ["pending", "succeeded", "failed", "canceled"] as const;
export const RefundStatus = z.enum(RefundStatusValues);
export type RefundStatus = z.infer<typeof RefundStatus>;

export const ChargebackStatusValues = [
  "opened",
  "needs_response",
  "evidence_submitted",
  "won",
  "lost",
  "reversed",
] as const;
export const ChargebackStatus = z.enum(ChargebackStatusValues);
export type ChargebackStatus = z.infer<typeof ChargebackStatus>;

export const CreditMemoStatusValues = ["open", "settled", "expired", "void"] as const;
export const CreditMemoStatus = z.enum(CreditMemoStatusValues);
export type CreditMemoStatus = z.infer<typeof CreditMemoStatus>;

export const PaymentMethodStatusValues = ["declined", "needs_reauth"] as const;
export const PaymentMethodStatus = z.enum(PaymentMethodStatusValues);
export type PaymentMethodStatus = z.infer<typeof PaymentMethodStatus>;

export const LedgerTransactionTypeValues = [
  "charge",
  "refund",
  "chargeback",
  "chargeback_reversal",
  "credit_issue",
  "credit_apply",
] as const;
export const LedgerTransactionType = z.enum(LedgerTransactionTypeValues);
export type LedgerTransactionType = z.infer<typeof LedgerTransactionType>;

export const PaymentMethodValues = ["card", "cash", "manual", "manual_cash", "saved_card"] as const;
export const PaymentMethod = z.enum(PaymentMethodValues);
export type PaymentMethod = z.infer<typeof PaymentMethod>;

export const InvoiceSourceTypeValues = [
  "adhoc",
  "adjustment",
  "enrollment",
  "membership",
  "pack",
  "pack_invoice",
  "private_session",
] as const;
export const InvoiceSourceType = z.enum(InvoiceSourceTypeValues);
export type InvoiceSourceType = z.infer<typeof InvoiceSourceType>;

// ---------------------------------------------------------------------------
// Attendance
// ---------------------------------------------------------------------------

export const AttendanceStatusValues = ["present", "absent", "late", "excused"] as const;
export const AttendanceStatus = z.enum(AttendanceStatusValues);
export type AttendanceStatus = z.infer<typeof AttendanceStatus>;

export const AttendanceSubmissionStatusValues = [
  "draft",
  "submitted",
  "confirmed",
  "rejected",
] as const;
export const AttendanceSubmissionStatus = z.enum(AttendanceSubmissionStatusValues);
export type AttendanceSubmissionStatus = z.infer<typeof AttendanceSubmissionStatus>;

export const AttendanceMethodValues = ["manual", "nfc", "qr", "self_check_in"] as const;
export const AttendanceMethod = z.enum(AttendanceMethodValues);
export type AttendanceMethod = z.infer<typeof AttendanceMethod>;

// ---------------------------------------------------------------------------
// Enrollment funnel
// ---------------------------------------------------------------------------

export const RegistrationStatusValues = [
  "lead",
  "trial",
  "offered",
  "enrolled",
  "waitlisted",
  "declined",
] as const;
export const RegistrationStatus = z.enum(RegistrationStatusValues);
export type RegistrationStatus = z.infer<typeof RegistrationStatus>;

export const WaitlistStatusValues = ["waiting", "offered", "expired", "enrolled"] as const;
export const WaitlistStatus = z.enum(WaitlistStatusValues);
export type WaitlistStatus = z.infer<typeof WaitlistStatus>;

export const OfferStatusValues = ["sent", "accepted", "declined", "expired"] as const;
export const OfferStatus = z.enum(OfferStatusValues);
export type OfferStatus = z.infer<typeof OfferStatus>;

export const TrialStatusValues = ["booked", "attended", "no_show", "offered", "declined"] as const;
export const TrialStatus = z.enum(TrialStatusValues);
export type TrialStatus = z.infer<typeof TrialStatus>;

export const LeadStageValues = ["new", "contacted", "trial", "won", "lost"] as const;
export const LeadStage = z.enum(LeadStageValues);
export type LeadStage = z.infer<typeof LeadStage>;

export const LeadStatusValues = ["active", "converted", "lost"] as const;
export const LeadStatus = z.enum(LeadStatusValues);
export type LeadStatus = z.infer<typeof LeadStatus>;

// ---------------------------------------------------------------------------
// Medical / injury
// ---------------------------------------------------------------------------

export const InjuryStatusValues = ["reported", "under_treatment", "recovering", "cleared"] as const;
export const InjuryStatus = z.enum(InjuryStatusValues);
export type InjuryStatus = z.infer<typeof InjuryStatus>;

export const InjurySeverityValues = ["minor", "moderate", "serious"] as const;
export const InjurySeverity = z.enum(InjurySeverityValues);
export type InjurySeverity = z.infer<typeof InjurySeverity>;

export const MedicalClearanceStatusValues = ["pending", "valid", "expiring", "expired"] as const;
export const MedicalClearanceStatus = z.enum(MedicalClearanceStatusValues);
export type MedicalClearanceStatus = z.infer<typeof MedicalClearanceStatus>;

export const MedicalClearanceTypeValues = [
  "annual_medical",
  "concussion_clearance",
  "return_to_play",
] as const;
export const MedicalClearanceType = z.enum(MedicalClearanceTypeValues);
export type MedicalClearanceType = z.infer<typeof MedicalClearanceType>;

export const InjuryBodyPartValues = [
  "ankle_right",
  "ankle_left",
  "knee_right",
  "knee_left",
  "shoulder_right",
  "shoulder_left",
  "head",
  "wrist",
  "hip",
  "back",
] as const;
export const InjuryBodyPart = z.enum(InjuryBodyPartValues);
export type InjuryBodyPart = z.infer<typeof InjuryBodyPart>;

// ---------------------------------------------------------------------------
// Notification / messaging
// ---------------------------------------------------------------------------

export const NotificationChannelValues = ["push", "email", "sms", "whatsapp"] as const;
export const NotificationChannel = z.enum(NotificationChannelValues);
export type NotificationChannel = z.infer<typeof NotificationChannel>;

export const NotificationStatusValues = [
  "queued",
  "sent",
  "delivered",
  "read",
  "failed",
  "bounced",
] as const;
export const NotificationStatus = z.enum(NotificationStatusValues);
export type NotificationStatus = z.infer<typeof NotificationStatus>;

export const ConversationTypeValues = ["direct", "group"] as const;
export const ConversationType = z.enum(ConversationTypeValues);
export type ConversationType = z.infer<typeof ConversationType>;

// ---------------------------------------------------------------------------
// Credentials / gate / check-in
// ---------------------------------------------------------------------------

export const CredentialStatusValues = ["active", "revoked", "lost"] as const;
export const CredentialStatus = z.enum(CredentialStatusValues);
export type CredentialStatus = z.infer<typeof CredentialStatus>;

export const CredentialTypeValues = ["nfc", "rfid"] as const;
export const CredentialType = z.enum(CredentialTypeValues);
export type CredentialType = z.infer<typeof CredentialType>;

export const GateStatusValues = ["active", "maintenance", "offline"] as const;
export const GateStatus = z.enum(GateStatusValues);
export type GateStatus = z.infer<typeof GateStatus>;

export const HolderTypeValues = [
  "athlete",
  "staff",
  "athlete_guest",
  "guardian",
  "trial",
  "visitor",
] as const;
export const HolderType = z.enum(HolderTypeValues);
export type HolderType = z.infer<typeof HolderType>;

export const PassStatusValues = ["issued", "active", "replaced", "revoked", "updated"] as const;
export const PassStatus = z.enum(PassStatusValues);
export type PassStatus = z.infer<typeof PassStatus>;

// ---------------------------------------------------------------------------
// Webhook / integration
// ---------------------------------------------------------------------------

export const WebhookEndpointStatusValues = ["active", "paused", "failed"] as const;
export const WebhookEndpointStatus = z.enum(WebhookEndpointStatusValues);
export type WebhookEndpointStatus = z.infer<typeof WebhookEndpointStatus>;

export const WebhookDeliveryStatusValues = [
  "queued",
  "retrying",
  "delivered",
  "failed",
  "abandoned",
] as const;
export const WebhookDeliveryStatus = z.enum(WebhookDeliveryStatusValues);
export type WebhookDeliveryStatus = z.infer<typeof WebhookDeliveryStatus>;

export const IntegrationStatusValues = [
  "connected",
  "disconnected",
  "error",
  "not_configured",
] as const;
export const IntegrationStatus = z.enum(IntegrationStatusValues);
export type IntegrationStatus = z.infer<typeof IntegrationStatus>;

// ---------------------------------------------------------------------------
// AI
// ---------------------------------------------------------------------------

export const AiRunStatusValues = ["succeeded", "failed", "rate_limited", "quota_exceeded"] as const;
export const AiRunStatus = z.enum(AiRunStatusValues);
export type AiRunStatus = z.infer<typeof AiRunStatus>;

export const AiPersonaValues = [
  "CoachAssistant",
  "ParentAssistant",
  "AdminAssistant",
  "FinanceAssistant",
  "HeadCoachAssistant",
  "MedicalAssistant",
  "AnomalyDetector",
  "NotificationDrafter",
  "SearchIndexer",
] as const;
export const AiPersona = z.enum(AiPersonaValues);
export type AiPersona = z.infer<typeof AiPersona>;

export const AiConversationStatusValues = ["active", "archived"] as const;
export const AiConversationStatus = z.enum(AiConversationStatusValues);
export type AiConversationStatus = z.infer<typeof AiConversationStatus>;

// ---------------------------------------------------------------------------
// Sport / progress cards / assessments
// ---------------------------------------------------------------------------

export const SportKeyValues = [
  "football",
  "swimming",
  "basketball",
  "tennis",
  "padel",
  "martial_arts",
  "athletics",
  "volleyball",
  "handball",
] as const;
export const SportKey = z.enum(SportKeyValues);
export type SportKey = z.infer<typeof SportKey>;

export const CardTypeValues = [
  "fifa_card",
  "attribute_card",
  "radar",
  "time_trial",
  "apparatus_scores",
] as const;
export const CardType = z.enum(CardTypeValues);
export type CardType = z.infer<typeof CardType>;

export const ScoringTypeValues = [
  "goals",
  "points",
  "sets",
  "time",
  "distance",
  "apparatus",
  "belt",
] as const;
export const ScoringType = z.enum(ScoringTypeValues);
export type ScoringType = z.infer<typeof ScoringType>;

// ---------------------------------------------------------------------------
// Approvals / reception
// ---------------------------------------------------------------------------

export const ApprovableTypeValues = [
  "registration",
  "document",
  "refund",
  "match",
  "attendance",
  "link_request",
  "athlete_transfer",
  "resource_booking",
] as const;
export const ApprovableType = z.enum(ApprovableTypeValues);
export type ApprovableType = z.infer<typeof ApprovableType>;

export const ApprovalTaskStatusValues = ["pending", "approved", "rejected"] as const;
export const ApprovalTaskStatus = z.enum(ApprovalTaskStatusValues);
export type ApprovalTaskStatus = z.infer<typeof ApprovalTaskStatus>;

export const PriorityValues = ["low", "medium", "high"] as const;
export const Priority = z.enum(PriorityValues);
export type Priority = z.infer<typeof Priority>;

// ---------------------------------------------------------------------------
// Business type + role
// ---------------------------------------------------------------------------

export const BusinessTypeValues = [
  "sports_center",
  "gym",
  "activity_center",
  "club",
  "academy",
  "multi_sport",
] as const;
export const BusinessType = z.enum(BusinessTypeValues);
export type BusinessType = z.infer<typeof BusinessType>;

export const RoleValues = [
  "owner",
  "admin",
  "branch_manager",
  "coach",
  "head_coach",
  "assistant_coach",
  "athlete",
  "parent_guardian",
  "front_desk",
  "viewer",
  "medical",
  "finance",
  "reception",
] as const;
export const Role = z.enum(RoleValues);
export type Role = z.infer<typeof Role>;

// ---------------------------------------------------------------------------
// GDPR / erasure
// ---------------------------------------------------------------------------

export const ErasureRequestStatusValues = [
  "REQUESTED",
  "EXPORTED",
  "APPROVED",
  "EXECUTED",
  "REJECTED",
] as const;
export const ErasureRequestStatus = z.enum(ErasureRequestStatusValues);
export type ErasureRequestStatus = z.infer<typeof ErasureRequestStatus>;

// ---------------------------------------------------------------------------
// Season / competition schedule
// ---------------------------------------------------------------------------

export const SeasonStatusValues = ["upcoming", "active", "closed", "archived"] as const;
export const SeasonStatus = z.enum(SeasonStatusValues);
export type SeasonStatus = z.infer<typeof SeasonStatus>;

export const RegistrationWindowStatusValues = ["open", "closed"] as const;
export const RegistrationWindowStatus = z.enum(RegistrationWindowStatusValues);
export type RegistrationWindowStatus = z.infer<typeof RegistrationWindowStatus>;

// ---------------------------------------------------------------------------
// Match squad / coach assignment roles
// ---------------------------------------------------------------------------

export const MatchSquadRoleValues = ["starter", "substitute", "reserve"] as const;
export const MatchSquadRole = z.enum(MatchSquadRoleValues);
export type MatchSquadRole = z.infer<typeof MatchSquadRole>;

export const CoachAssignmentRoleValues = ["head_coach", "coach", "assistant_coach"] as const;
export const CoachAssignmentRole = z.enum(CoachAssignmentRoleValues);
export type CoachAssignmentRole = z.infer<typeof CoachAssignmentRole>;

export const CoachAssignmentStatusValues = ["active", "inactive", "pending", "blocked"] as const;
export const CoachAssignmentStatus = z.enum(CoachAssignmentStatusValues);
export type CoachAssignmentStatus = z.infer<typeof CoachAssignmentStatus>;

// ---------------------------------------------------------------------------
// Auth / access
// ---------------------------------------------------------------------------

export const ApiKeyStatusValues = ["active", "revoked", "suspended"] as const;
export const ApiKeyStatus = z.enum(ApiKeyStatusValues);
export type ApiKeyStatus = z.infer<typeof ApiKeyStatus>;

export const MfaMethodStatusValues = ["active", "disabled", "revoked"] as const;
export const MfaMethodStatus = z.enum(MfaMethodStatusValues);
export type MfaMethodStatus = z.infer<typeof MfaMethodStatus>;

export const MfaMethodTypeValues = ["totp", "sms", "email", "fido2", "passkey"] as const;
export const MfaMethodType = z.enum(MfaMethodTypeValues);
export type MfaMethodType = z.infer<typeof MfaMethodType>;

export const InvitationStatusValues = ["pending", "accepted", "expired", "revoked"] as const;
export const InvitationStatus = z.enum(InvitationStatusValues);
export type InvitationStatus = z.infer<typeof InvitationStatus>;

export const ScopeTypeValues = ["tenant", "organization", "branch"] as const;
export const ScopeType = z.enum(ScopeTypeValues);
export type ScopeType = z.infer<typeof ScopeType>;

// ---------------------------------------------------------------------------
// Reception / day passes
// ---------------------------------------------------------------------------

export const DayPassStatusValues = ["issued", "active", "used", "voided"] as const;
export const DayPassStatus = z.enum(DayPassStatusValues);
export type DayPassStatus = z.infer<typeof DayPassStatus>;

export const ReceptionVisitTypeValues = [
  "walk_in",
  "drop_off",
  "delivery",
  "contractor",
  "trial",
  "tour",
] as const;
export const ReceptionVisitType = z.enum(ReceptionVisitTypeValues);
export type ReceptionVisitType = z.infer<typeof ReceptionVisitType>;

// ---------------------------------------------------------------------------
// Bookings / facilities
// ---------------------------------------------------------------------------

export const ActivityTypeValues = ["training", "match", "session", "blackout"] as const;
export const ActivityType = z.enum(ActivityTypeValues);
export type ActivityType = z.infer<typeof ActivityType>;

export const FacilityTypeValues = ["pitch", "court", "pool", "equipment", "hall"] as const;
export const FacilityType = z.enum(FacilityTypeValues);
export type FacilityType = z.infer<typeof FacilityType>;

export const ResourceBookingStatusValues = ["confirmed", "cancelled", "blocked"] as const;
export const ResourceBookingStatus = z.enum(ResourceBookingStatusValues);
export type ResourceBookingStatus = z.infer<typeof ResourceBookingStatus>;

// ---------------------------------------------------------------------------
// Documents / attachments
// ---------------------------------------------------------------------------

export const DocumentTypeValues = [
  "passport",
  "national_id",
  "medical_clearance",
  "receipt",
  "contract",
  "work_permit",
  "erasure_report",
  "family_invoice_bundle",
] as const;
export const DocumentType = z.enum(DocumentTypeValues);
export type DocumentType = z.infer<typeof DocumentType>;

export const DocumentOwnerTypeValues = ["athlete", "staff", "expense", "user"] as const;
export const DocumentOwnerType = z.enum(DocumentOwnerTypeValues);
export type DocumentOwnerType = z.infer<typeof DocumentOwnerType>;

export const AthleteDocumentStatusValues = [
  "pending_review",
  "valid",
  "expiring",
  "expired",
] as const;
export const AthleteDocumentStatus = z.enum(AthleteDocumentStatusValues);
export type AthleteDocumentStatus = z.infer<typeof AthleteDocumentStatus>;

export const StaffDocumentStatusValues = ["valid", "expired"] as const;
export const StaffDocumentStatus = z.enum(StaffDocumentStatusValues);
export type StaffDocumentStatus = z.infer<typeof StaffDocumentStatus>;

// ---------------------------------------------------------------------------
// Certifications / background checks / consents
// ---------------------------------------------------------------------------

export const CertificationStatusValues = ["valid", "expiring", "expired"] as const;
export const CertificationStatus = z.enum(CertificationStatusValues);
export type CertificationStatus = z.infer<typeof CertificationStatus>;

export const BackgroundCheckStatusValues = ["pending", "verified", "expired"] as const;
export const BackgroundCheckStatus = z.enum(BackgroundCheckStatusValues);
export type BackgroundCheckStatus = z.infer<typeof BackgroundCheckStatus>;

export const BackgroundCheckTypeValues = ["dbs", "police", "reference"] as const;
export const BackgroundCheckType = z.enum(BackgroundCheckTypeValues);
export type BackgroundCheckType = z.infer<typeof BackgroundCheckType>;

export const ConsentStatusValues = ["granted", "revoked", "expired"] as const;
export const ConsentStatus = z.enum(ConsentStatusValues);
export type ConsentStatus = z.infer<typeof ConsentStatus>;

export const PolicyAckStatusValues = ["acknowledged", "pending", "overdue", "superseded"] as const;
export const PolicyAckStatus = z.enum(PolicyAckStatusValues);
export type PolicyAckStatus = z.infer<typeof PolicyAckStatus>;

// ---------------------------------------------------------------------------
// HR (staff)
// ---------------------------------------------------------------------------

export const StaffBonusTypeValues = ["win_bonus", "retention", "referral", "sign_on"] as const;
export const StaffBonusType = z.enum(StaffBonusTypeValues);
export type StaffBonusType = z.infer<typeof StaffBonusType>;

export const StaffBonusStatusValues = ["pending", "approved", "paid"] as const;
export const StaffBonusStatus = z.enum(StaffBonusStatusValues);
export type StaffBonusStatus = z.infer<typeof StaffBonusStatus>;

export const StaffLeaveTypeValues = [
  "annual",
  "sick",
  "unpaid",
  "parental",
  "bereavement",
] as const;
export const StaffLeaveType = z.enum(StaffLeaveTypeValues);
export type StaffLeaveType = z.infer<typeof StaffLeaveType>;

export const StaffLeaveStatusValues = [
  "requested",
  "approved",
  "in_progress",
  "completed",
  "rejected",
] as const;
export const StaffLeaveStatus = z.enum(StaffLeaveStatusValues);
export type StaffLeaveStatus = z.infer<typeof StaffLeaveStatus>;

export const PayrollRunStatusValues = ["draft", "approved", "paid", "failed"] as const;
export const PayrollRunStatus = z.enum(PayrollRunStatusValues);
export type PayrollRunStatus = z.infer<typeof PayrollRunStatus>;

// ---------------------------------------------------------------------------
// Expenses / finance ops
// ---------------------------------------------------------------------------

export const ExpenseStatusValues = ["draft", "approved", "paid"] as const;
export const ExpenseStatus = z.enum(ExpenseStatusValues);
export type ExpenseStatus = z.infer<typeof ExpenseStatus>;

export const TenantPaymentAccountStatusValues = [
  "pending_verification",
  "active",
  "restricted",
  "disabled",
] as const;
export const TenantPaymentAccountStatus = z.enum(TenantPaymentAccountStatusValues);
export type TenantPaymentAccountStatus = z.infer<typeof TenantPaymentAccountStatus>;

export const TenantPaymentAccountTypeValues = ["connect_standard", "paddle_platform"] as const;
export const TenantPaymentAccountType = z.enum(TenantPaymentAccountTypeValues);
export type TenantPaymentAccountType = z.infer<typeof TenantPaymentAccountType>;

export const CardBrandValues = ["visa", "mastercard", "amex", "discover"] as const;
export const CardBrand = z.enum(CardBrandValues);
export type CardBrand = z.infer<typeof CardBrand>;

// ---------------------------------------------------------------------------
// Events / calendar / trainings
// ---------------------------------------------------------------------------

export const EventTypeValues = ["training", "match", "session", "festival"] as const;
export const EventType = z.enum(EventTypeValues);
export type EventType = z.infer<typeof EventType>;

export const EventStatusValues = ["scheduled", "completed", "cancelled"] as const;
export const EventStatus = z.enum(EventStatusValues);
export type EventStatus = z.infer<typeof EventStatus>;

export const EventReminderStatusValues = ["scheduled", "sent", "failed"] as const;
export const EventReminderStatus = z.enum(EventReminderStatusValues);
export type EventReminderStatus = z.infer<typeof EventReminderStatus>;

export const RsvpStatusValues = ["pending", "confirmed", "declined", "cancelled"] as const;
export const RsvpStatus = z.enum(RsvpStatusValues);
export type RsvpStatus = z.infer<typeof RsvpStatus>;

export const TrainingSessionStatusValues = ["scheduled", "completed", "cancelled"] as const;
export const TrainingSessionStatus = z.enum(TrainingSessionStatusValues);
export type TrainingSessionStatus = z.infer<typeof TrainingSessionStatus>;

export const PrivateSessionStatusValues = [
  "scheduled",
  "completed",
  "no_show",
  "cancelled",
] as const;
export const PrivateSessionStatus = z.enum(PrivateSessionStatusValues);
export type PrivateSessionStatus = z.infer<typeof PrivateSessionStatus>;

export const DayOfWeekValues = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;
export const DayOfWeek = z.enum(DayOfWeekValues);
export type DayOfWeek = z.infer<typeof DayOfWeek>;

// ---------------------------------------------------------------------------
// Announcements / templates
// ---------------------------------------------------------------------------

export const AnnouncementStatusValues = ["draft", "scheduled", "published"] as const;
export const AnnouncementStatus = z.enum(AnnouncementStatusValues);
export type AnnouncementStatus = z.infer<typeof AnnouncementStatus>;

export const NotificationTemplateStatusValues = ["active", "draft"] as const;
export const NotificationTemplateStatus = z.enum(NotificationTemplateStatusValues);
export type NotificationTemplateStatus = z.infer<typeof NotificationTemplateStatus>;

// ---------------------------------------------------------------------------
// Talent flags / awards
// ---------------------------------------------------------------------------

export const TalentFlagStatusValues = [
  "active",
  "flagged",
  "review_scheduled",
  "promoted",
  "unflagged",
  "graduated_out",
] as const;
export const TalentFlagStatus = z.enum(TalentFlagStatusValues);
export type TalentFlagStatus = z.infer<typeof TalentFlagStatus>;

export const AwardTypeCategoryValues = [
  "man_of_the_match",
  "attendance_star",
  "player_of_the_month",
  "syllabus_completion",
] as const;
export const AwardTypeCategory = z.enum(AwardTypeCategoryValues);
export type AwardTypeCategory = z.infer<typeof AwardTypeCategory>;

// ---------------------------------------------------------------------------
// Sync (offline)
// ---------------------------------------------------------------------------

export const SyncQueueStatusValues = ["pending", "in_progress", "synced", "failed"] as const;
export const SyncQueueStatus = z.enum(SyncQueueStatusValues);
export type SyncQueueStatus = z.infer<typeof SyncQueueStatus>;

// ---------------------------------------------------------------------------
// Entitlements / plan grants
// ---------------------------------------------------------------------------

export const EntitlementKindValues = ["slot", "pool", "feature"] as const;
export const EntitlementKind = z.enum(EntitlementKindValues);
export type EntitlementKind = z.infer<typeof EntitlementKind>;

export const EntitlementLicenseStatusValues = [
  "active",
  "exhausted",
  "expired",
  "suspended",
] as const;
export const EntitlementLicenseStatus = z.enum(EntitlementLicenseStatusValues);
export type EntitlementLicenseStatus = z.infer<typeof EntitlementLicenseStatus>;

// ---------------------------------------------------------------------------
// Safeguarding
// ---------------------------------------------------------------------------

export const SafeguardingIncidentStatusValues = ["reported", "under_review", "resolved"] as const;
export const SafeguardingIncidentStatus = z.enum(SafeguardingIncidentStatusValues);
export type SafeguardingIncidentStatus = z.infer<typeof SafeguardingIncidentStatus>;

// ---------------------------------------------------------------------------
// Coach notes
// ---------------------------------------------------------------------------

export const CoachNoteVisibilityValues = [
  "coach_only",
  "shared",
  "private",
  "shared_with_parent",
] as const;
export const CoachNoteVisibility = z.enum(CoachNoteVisibilityValues);
export type CoachNoteVisibility = z.infer<typeof CoachNoteVisibility>;

// ---------------------------------------------------------------------------
// Tenants (as observed in the mock set)
// ---------------------------------------------------------------------------

export const TenantStatusValues = [
  "active",
  "trialing",
  "past_due",
  "paused",
  "canceled",
  "suspended",
  "external",
] as const;
export const TenantStatus = z.enum(TenantStatusValues);
export type TenantStatus = z.infer<typeof TenantStatus>;

// ---------------------------------------------------------------------------
// Tasks / CRM
// ---------------------------------------------------------------------------

export const TaskStatusValues = ["todo", "in_progress", "snoozed", "done", "cancelled"] as const;
export const TaskStatus = z.enum(TaskStatusValues);
export type TaskStatus = z.infer<typeof TaskStatus>;
