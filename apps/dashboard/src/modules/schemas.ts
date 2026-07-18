/**
 * @file schemas.ts
 * @module modules/schemas
 *
 * @description
 * Central library of `FieldSchema[]` presets consumed by module manifests.
 * Keeps every module's `formFields` co-located here so we get a consistent
 * editor across the app and each manifest stays a thin declaration.
 */

import type { FieldSchema } from "@/lib/module";

/** Person profile — used by athletes, coaches, staff, users, people. */
export const personFields: FieldSchema[] = [
  {
    name: "fullName",
    label: "Full name",
    kind: "text",
    section: "Profile",
    isRequired: true,
    colSpan: 2,
  },
  { name: "gsm", label: "Phone", kind: "phone", section: "Profile", colSpan: 1 },
  { name: "email", label: "Email", kind: "email", section: "Profile", colSpan: 1 },
  {
    name: "gender",
    label: "Gender",
    kind: "select",
    section: "Profile",
    colSpan: 1,
    options: [
      { id: "female", label: "Female" },
      { id: "male", label: "Male" },
      { id: "other", label: "Prefer not to say" },
    ],
  },
  { name: "dateOfBirth", label: "Date of birth", kind: "date", section: "Profile", colSpan: 1 },
  { name: "branch", label: "Branch", kind: "text", section: "Assignment", colSpan: 1 },
  {
    name: "isActive",
    label: "Active",
    kind: "switch",
    section: "Status",
    colSpan: 1,
    defaultValue: true,
  },
];

export const athleteFields: FieldSchema[] = [
  // ---------------------------------------------------------------------
  // Personal — first 5 fields of the shared person profile (name /
  // phone / email / gender / date of birth). Reused verbatim so the
  // athlete registration form matches every other person surface.
  // ---------------------------------------------------------------------
  ...personFields.slice(0, 5),

  // ---------------------------------------------------------------------
  // Guardian — required for minors, optional but visible for adults.
  // The section drives the Guardian step in the ProgressTabs layout
  // (see `athletesModule.formSteps`).
  // ---------------------------------------------------------------------
  { name: "guardianName", label: "Guardian name", kind: "text", section: "Guardian", colSpan: 2 },
  {
    name: "guardianRelation",
    label: "Relation",
    kind: "select",
    section: "Guardian",
    colSpan: 1,
    options: [
      { id: "parent", label: "Parent" },
      { id: "guardian", label: "Legal guardian" },
      { id: "grandparent", label: "Grandparent" },
      { id: "sibling", label: "Sibling" },
      { id: "other", label: "Other" },
    ],
  },
  {
    name: "guardianPhone",
    label: "Guardian phone",
    kind: "phone",
    section: "Guardian",
    colSpan: 1,
  },
  {
    name: "guardianEmail",
    label: "Guardian email",
    kind: "email",
    section: "Guardian",
    colSpan: 2,
  },
  {
    name: "emergencyContact",
    label: "Emergency contact",
    kind: "phone",
    section: "Guardian",
    colSpan: 2,
    description: "Alternative number to call if the guardian is unreachable.",
  },

  // ---------------------------------------------------------------------
  // Sports — assignment + team affiliation.
  // ---------------------------------------------------------------------
  { name: "primarySport", label: "Primary sport", kind: "text", section: "Sports", colSpan: 1 },
  { name: "team", label: "Team", kind: "text", section: "Sports", colSpan: 1 },
  { name: "branch", label: "Branch", kind: "text", section: "Sports", colSpan: 1 },
  {
    name: "isActive",
    label: "Active",
    kind: "switch",
    section: "Sports",
    colSpan: 1,
    defaultValue: true,
  },

  // ---------------------------------------------------------------------
  // Documents — file uploads for consent forms, medical clearance,
  // and profile photo. The DropZone wrapper handles multi-file and
  // MIME filtering per field.
  // ---------------------------------------------------------------------
  {
    name: "profilePhoto",
    label: "Profile photo",
    kind: "file",
    section: "Documents",
    colSpan: 1,
    file: { accept: "image/*", maxSize: 2 * 1024 * 1024, maxFiles: 1 },
    description: "Square PNG or JPG, up to 2 MB.",
  },
  {
    name: "consentForm",
    label: "Consent form",
    kind: "file",
    section: "Documents",
    colSpan: 1,
    file: { accept: ".pdf,application/pdf", maxSize: 5 * 1024 * 1024, maxFiles: 1 },
    description: "Signed guardian consent form. PDF, up to 5 MB.",
  },
  {
    name: "medicalClearance",
    label: "Medical clearance",
    kind: "file",
    section: "Documents",
    colSpan: 2,
    file: { accept: ".pdf,image/*", maxSize: 10 * 1024 * 1024, maxFiles: 3, multiple: true },
    description: "Doctor's clearance or medical records. Multiple files up to 10 MB each.",
  },
];

export const coachFields: FieldSchema[] = [
  ...personFields.slice(0, 5),
  { name: "sportsCovered", label: "Sports covered", kind: "text", section: "Sports", colSpan: 2 },
  { name: "availability", label: "Availability", kind: "text", section: "Sports", colSpan: 1 },
  { name: "branch", label: "Branch", kind: "text", section: "Sports", colSpan: 1 },
  {
    name: "isActive",
    label: "Active",
    kind: "switch",
    section: "Status",
    colSpan: 1,
    defaultValue: true,
  },
];

export const staffFields: FieldSchema[] = [
  ...personFields.slice(0, 5),
  { name: "role", label: "Role", kind: "text", section: "Employment", colSpan: 1 },
  { name: "branch", label: "Branch", kind: "text", section: "Employment", colSpan: 1 },
  { name: "startDate", label: "Start date", kind: "date", section: "Employment", colSpan: 1 },
  {
    name: "isActive",
    label: "Active",
    kind: "switch",
    section: "Status",
    colSpan: 1,
    defaultValue: true,
  },
];

export const teamFields: FieldSchema[] = [
  { name: "name", label: "Team name", kind: "text", section: "Team", isRequired: true, colSpan: 2 },
  { name: "sport", label: "Sport", kind: "text", section: "Team", colSpan: 1 },
  { name: "coach", label: "Head coach", kind: "text", section: "Team", colSpan: 1 },
  { name: "branch", label: "Branch", kind: "text", section: "Assignment", colSpan: 1 },
  { name: "season", label: "Season", kind: "text", section: "Assignment", colSpan: 1 },
  {
    name: "level",
    label: "Level",
    kind: "select",
    section: "Assignment",
    colSpan: 1,
    options: [
      { id: "u10", label: "U-10" },
      { id: "u12", label: "U-12" },
      { id: "u14", label: "U-14" },
      { id: "u16", label: "U-16" },
      { id: "u18", label: "U-18" },
      { id: "senior", label: "Senior" },
    ],
  },
  {
    name: "rosterCount",
    label: "Roster size",
    kind: "number",
    section: "Assignment",
    colSpan: 1,
    minValue: 0,
    maxValue: 50,
  },
];

export const seasonFields: FieldSchema[] = [
  {
    name: "name",
    label: "Season name",
    kind: "text",
    section: "Season",
    isRequired: true,
    colSpan: 2,
  },
  { name: "sport", label: "Sport", kind: "text", section: "Season", colSpan: 1 },
  { name: "startAt", label: "Start date", kind: "date", section: "Dates", colSpan: 1 },
  { name: "endAt", label: "End date", kind: "date", section: "Dates", colSpan: 1 },
  {
    name: "isActive",
    label: "Active",
    kind: "switch",
    section: "Status",
    colSpan: 1,
    defaultValue: true,
  },
];

export const eventFields: FieldSchema[] = [
  {
    name: "name",
    label: "Event name",
    kind: "text",
    section: "Event",
    isRequired: true,
    colSpan: 2,
  },
  {
    name: "type",
    label: "Type",
    kind: "select",
    section: "Event",
    colSpan: 1,
    options: [
      { id: "tournament", label: "Tournament" },
      { id: "training", label: "Training" },
      { id: "friendly", label: "Friendly" },
      { id: "showcase", label: "Showcase" },
    ],
  },
  { name: "team", label: "Team", kind: "text", section: "Event", colSpan: 1 },
  { name: "startAt", label: "Start", kind: "date", section: "When", colSpan: 1 },
  { name: "endAt", label: "End", kind: "date", section: "When", colSpan: 1 },
  { name: "location", label: "Location", kind: "text", section: "Where", colSpan: 2 },
  { name: "notes", label: "Notes", kind: "textarea", section: "Details", colSpan: 2 },
];

export const matchFields: FieldSchema[] = [
  { name: "name", label: "Match", kind: "text", section: "Match", isRequired: true, colSpan: 2 },
  { name: "homeTeam", label: "Home team", kind: "text", section: "Match", colSpan: 1 },
  { name: "awayTeam", label: "Away team", kind: "text", section: "Match", colSpan: 1 },
  { name: "startAt", label: "Kick-off", kind: "date", section: "When", colSpan: 1 },
  { name: "venue", label: "Venue", kind: "text", section: "When", colSpan: 1 },
  { name: "notes", label: "Notes", kind: "textarea", section: "Details", colSpan: 2 },
];

export const trainingSessionFields: FieldSchema[] = [
  {
    name: "name",
    label: "Session",
    kind: "text",
    section: "Session",
    isRequired: true,
    colSpan: 2,
  },
  { name: "team", label: "Team", kind: "text", section: "Session", colSpan: 1 },
  { name: "coach", label: "Coach", kind: "text", section: "Session", colSpan: 1 },
  { name: "startAt", label: "Start", kind: "date", section: "When", colSpan: 1 },
  {
    name: "duration",
    label: "Duration (min)",
    kind: "number",
    section: "When",
    colSpan: 1,
    minValue: 15,
    maxValue: 240,
  },
  { name: "location", label: "Location", kind: "text", section: "Where", colSpan: 2 },
];

export const privateSessionFields: FieldSchema[] = [
  {
    name: "name",
    label: "Session title",
    kind: "text",
    section: "Session",
    isRequired: true,
    colSpan: 2,
  },
  { name: "coach", label: "Coach", kind: "text", section: "Session", colSpan: 1 },
  { name: "athlete", label: "Athlete", kind: "text", section: "Session", colSpan: 1 },
  { name: "startAt", label: "Start", kind: "date", section: "When", colSpan: 1 },
  {
    name: "duration",
    label: "Duration (min)",
    kind: "number",
    section: "When",
    colSpan: 1,
    minValue: 15,
    maxValue: 240,
  },
  { name: "notes", label: "Notes", kind: "textarea", section: "Details", colSpan: 2 },
];

export const drillFields: FieldSchema[] = [
  {
    name: "name",
    label: "Drill name",
    kind: "text",
    section: "Drill",
    isRequired: true,
    colSpan: 2,
  },
  { name: "sport", label: "Sport", kind: "text", section: "Drill", colSpan: 1 },
  {
    name: "level",
    label: "Level",
    kind: "select",
    section: "Drill",
    colSpan: 1,
    options: [
      { id: "beginner", label: "Beginner" },
      { id: "intermediate", label: "Intermediate" },
      { id: "advanced", label: "Advanced" },
    ],
  },
  { name: "description", label: "Description", kind: "textarea", section: "Details", colSpan: 2 },
];

export const competitionFields: FieldSchema[] = [
  {
    name: "name",
    label: "Competition",
    kind: "text",
    section: "Competition",
    isRequired: true,
    colSpan: 2,
  },
  {
    name: "format",
    label: "Format",
    kind: "select",
    section: "Competition",
    colSpan: 1,
    options: [
      { id: "knockout", label: "Knockout" },
      { id: "league", label: "League" },
      { id: "round-robin", label: "Round-robin" },
      { id: "showcase", label: "Showcase" },
    ],
  },
  { name: "startAt", label: "Starts", kind: "date", section: "Schedule", colSpan: 1 },
  { name: "endAt", label: "Ends", kind: "date", section: "Schedule", colSpan: 1 },
];

export const formationFields: FieldSchema[] = [
  {
    name: "name",
    label: "Formation name",
    kind: "text",
    section: "Formation",
    isRequired: true,
    colSpan: 2,
  },
  { name: "sport", label: "Sport", kind: "text", section: "Formation", colSpan: 1 },
  {
    name: "shape",
    label: "Shape",
    kind: "text",
    section: "Formation",
    colSpan: 1,
    placeholder: "4-3-3",
  },
  { name: "notes", label: "Notes", kind: "textarea", section: "Details", colSpan: 2 },
];

export const facilityFields: FieldSchema[] = [
  {
    name: "name",
    label: "Facility name",
    kind: "text",
    section: "Facility",
    isRequired: true,
    colSpan: 2,
  },
  {
    name: "type",
    label: "Type",
    kind: "select",
    section: "Facility",
    colSpan: 1,
    options: [
      { id: "pitch", label: "Pitch" },
      { id: "court", label: "Court" },
      { id: "pool", label: "Pool" },
      { id: "gym", label: "Gym" },
      { id: "studio", label: "Studio" },
    ],
  },
  {
    name: "capacity",
    label: "Capacity",
    kind: "number",
    section: "Facility",
    colSpan: 1,
    minValue: 0,
    maxValue: 1000,
  },
  { name: "branch", label: "Branch", kind: "text", section: "Location", colSpan: 1 },
  {
    name: "indoor",
    label: "Indoor",
    kind: "switch",
    section: "Location",
    colSpan: 1,
    defaultValue: false,
  },
];

export const documentFields: FieldSchema[] = [
  {
    name: "name",
    label: "Document title",
    kind: "text",
    section: "Document",
    isRequired: true,
    colSpan: 2,
  },
  {
    name: "kind",
    label: "Kind",
    kind: "select",
    section: "Document",
    colSpan: 1,
    options: [
      { id: "policy", label: "Policy" },
      { id: "consent", label: "Consent" },
      { id: "medical", label: "Medical" },
      { id: "contract", label: "Contract" },
      { id: "other", label: "Other" },
    ],
  },
  { name: "owner", label: "Owner", kind: "text", section: "Document", colSpan: 1 },
];

export const leadFields: FieldSchema[] = [
  {
    name: "fullName",
    label: "Full name",
    kind: "text",
    section: "Contact",
    isRequired: true,
    colSpan: 2,
  },
  { name: "email", label: "Email", kind: "email", section: "Contact", colSpan: 1 },
  { name: "phone", label: "Phone", kind: "phone", section: "Contact", colSpan: 1 },
  {
    name: "source",
    label: "Source",
    kind: "select",
    section: "Funnel",
    colSpan: 1,
    options: [
      { id: "website", label: "Website" },
      { id: "referral", label: "Referral" },
      { id: "walk-in", label: "Walk-in" },
      { id: "social", label: "Social" },
      { id: "event", label: "Event" },
    ],
  },
  {
    name: "stage",
    label: "Stage",
    kind: "select",
    section: "Funnel",
    colSpan: 1,
    options: [
      { id: "new", label: "New" },
      { id: "contacted", label: "Contacted" },
      { id: "qualified", label: "Qualified" },
      { id: "converted", label: "Converted" },
      { id: "lost", label: "Lost" },
    ],
  },
  { name: "notes", label: "Notes", kind: "textarea", section: "Funnel", colSpan: 2 },
];

export const membershipFields: FieldSchema[] = [
  {
    name: "name",
    label: "Plan name",
    kind: "text",
    section: "Membership",
    isRequired: true,
    colSpan: 2,
  },
  {
    name: "price",
    label: "Price",
    kind: "currency",
    section: "Membership",
    colSpan: 1,
    minValue: 0,
  },
  {
    name: "cadence",
    label: "Cadence",
    kind: "select",
    section: "Membership",
    colSpan: 1,
    options: [
      { id: "monthly", label: "Monthly" },
      { id: "quarterly", label: "Quarterly" },
      { id: "annual", label: "Annual" },
    ],
  },
  {
    name: "seats",
    label: "Included seats",
    kind: "number",
    section: "Membership",
    colSpan: 1,
    minValue: 1,
  },
  {
    name: "isActive",
    label: "Active",
    kind: "switch",
    section: "Status",
    colSpan: 1,
    defaultValue: true,
  },
];

export const announcementFields: FieldSchema[] = [
  {
    name: "title",
    label: "Title",
    kind: "text",
    section: "Announcement",
    isRequired: true,
    colSpan: 2,
  },
  {
    name: "audience",
    label: "Audience",
    kind: "select",
    section: "Announcement",
    colSpan: 1,
    options: [
      { id: "all", label: "Everyone" },
      { id: "athletes", label: "Athletes" },
      { id: "guardians", label: "Guardians" },
      { id: "staff", label: "Staff" },
    ],
  },
  { name: "publishAt", label: "Publish at", kind: "date", section: "Announcement", colSpan: 1 },
  { name: "body", label: "Body", kind: "textarea", section: "Content", colSpan: 2 },
];

export const passFields: FieldSchema[] = [
  { name: "name", label: "Pass name", kind: "text", section: "Pass", isRequired: true, colSpan: 2 },
  { name: "credits", label: "Credits", kind: "number", section: "Pass", colSpan: 1, minValue: 1 },
  { name: "price", label: "Price", kind: "currency", section: "Pass", colSpan: 1, minValue: 0 },
  {
    name: "expiresIn",
    label: "Expires (days)",
    kind: "number",
    section: "Pass",
    colSpan: 1,
    minValue: 1,
  },
];

export const expenseFields: FieldSchema[] = [
  {
    name: "name",
    label: "Expense",
    kind: "text",
    section: "Expense",
    isRequired: true,
    colSpan: 2,
  },
  {
    name: "amount",
    label: "Amount",
    kind: "currency",
    section: "Expense",
    colSpan: 1,
    minValue: 0,
  },
  { name: "incurredAt", label: "Incurred", kind: "date", section: "Expense", colSpan: 1 },
  {
    name: "category",
    label: "Category",
    kind: "select",
    section: "Expense",
    colSpan: 1,
    options: [
      { id: "facility", label: "Facility" },
      { id: "equipment", label: "Equipment" },
      { id: "travel", label: "Travel" },
      { id: "staff", label: "Staff" },
      { id: "marketing", label: "Marketing" },
      { id: "other", label: "Other" },
    ],
  },
  { name: "branch", label: "Branch", kind: "text", section: "Expense", colSpan: 1 },
  { name: "notes", label: "Notes", kind: "textarea", section: "Details", colSpan: 2 },
];

export const credentialFields: FieldSchema[] = [
  {
    name: "name",
    label: "Credential",
    kind: "text",
    section: "Credential",
    isRequired: true,
    colSpan: 2,
  },
  {
    name: "kind",
    label: "Kind",
    kind: "select",
    section: "Credential",
    colSpan: 1,
    options: [
      { id: "nfc", label: "NFC" },
      { id: "rfid", label: "RFID" },
      { id: "qr", label: "QR" },
    ],
  },
  { name: "holder", label: "Holder", kind: "text", section: "Credential", colSpan: 1 },
  { name: "expiresAt", label: "Expires", kind: "date", section: "Credential", colSpan: 1 },
  {
    name: "isActive",
    label: "Active",
    kind: "switch",
    section: "Status",
    colSpan: 1,
    defaultValue: true,
  },
];

export const performanceFields: FieldSchema[] = [
  {
    name: "name",
    label: "Metric",
    kind: "text",
    section: "Performance",
    isRequired: true,
    colSpan: 2,
  },
  { name: "athlete", label: "Athlete", kind: "text", section: "Performance", colSpan: 1 },
  { name: "value", label: "Value", kind: "number", section: "Performance", colSpan: 1 },
  {
    name: "unit",
    label: "Unit",
    kind: "text",
    section: "Performance",
    colSpan: 1,
    placeholder: "sec / kg / reps",
  },
  { name: "recordedAt", label: "Recorded", kind: "date", section: "Performance", colSpan: 1 },
];

export const medicalFields: FieldSchema[] = [
  {
    name: "athlete",
    label: "Athlete",
    kind: "text",
    section: "Medical",
    isRequired: true,
    colSpan: 2,
  },
  {
    name: "kind",
    label: "Kind",
    kind: "select",
    section: "Medical",
    colSpan: 1,
    options: [
      { id: "clearance", label: "Clearance" },
      { id: "injury", label: "Injury" },
      { id: "return-to-play", label: "Return to play" },
      { id: "assessment", label: "Assessment" },
    ],
  },
  { name: "recordedAt", label: "Recorded", kind: "date", section: "Medical", colSpan: 1 },
  { name: "notes", label: "Notes", kind: "textarea", section: "Details", colSpan: 2 },
];

export const developmentFields: FieldSchema[] = [
  {
    name: "athlete",
    label: "Athlete",
    kind: "text",
    section: "Plan",
    isRequired: true,
    colSpan: 2,
  },
  { name: "goal", label: "Goal", kind: "text", section: "Plan", colSpan: 2 },
  { name: "startAt", label: "Start", kind: "date", section: "Plan", colSpan: 1 },
  { name: "targetAt", label: "Target", kind: "date", section: "Plan", colSpan: 1 },
  { name: "notes", label: "Notes", kind: "textarea", section: "Details", colSpan: 2 },
];

export const awardFields: FieldSchema[] = [
  { name: "name", label: "Award", kind: "text", section: "Award", isRequired: true, colSpan: 2 },
  { name: "athlete", label: "Athlete", kind: "text", section: "Award", colSpan: 1 },
  { name: "awardedAt", label: "Awarded", kind: "date", section: "Award", colSpan: 1 },
  { name: "notes", label: "Notes", kind: "textarea", section: "Details", colSpan: 2 },
];

export const safeguardingFields: FieldSchema[] = [
  {
    name: "name",
    label: "Case title",
    kind: "text",
    section: "Case",
    isRequired: true,
    colSpan: 2,
  },
  {
    name: "severity",
    label: "Severity",
    kind: "select",
    section: "Case",
    colSpan: 1,
    options: [
      { id: "low", label: "Low" },
      { id: "medium", label: "Medium" },
      { id: "high", label: "High" },
      { id: "critical", label: "Critical" },
    ],
  },
  {
    name: "status",
    label: "Status",
    kind: "select",
    section: "Case",
    colSpan: 1,
    options: [
      { id: "open", label: "Open" },
      { id: "under-review", label: "Under review" },
      { id: "resolved", label: "Resolved" },
      { id: "escalated", label: "Escalated" },
    ],
  },
  { name: "reporter", label: "Reporter", kind: "text", section: "Case", colSpan: 1 },
  { name: "reportedAt", label: "Reported", kind: "date", section: "Case", colSpan: 1 },
  { name: "notes", label: "Notes", kind: "textarea", section: "Details", colSpan: 2 },
];

export const branchFields: FieldSchema[] = [
  {
    name: "name",
    label: "Branch name",
    kind: "text",
    section: "Branch",
    isRequired: true,
    colSpan: 2,
  },
  { name: "city", label: "City", kind: "text", section: "Branch", colSpan: 1 },
  { name: "country", label: "Country", kind: "text", section: "Branch", colSpan: 1 },
  { name: "address", label: "Address", kind: "text", section: "Branch", colSpan: 2 },
  {
    name: "athletesCount",
    label: "Athletes",
    kind: "number",
    section: "Stats",
    colSpan: 1,
    minValue: 0,
  },
  {
    name: "isActive",
    label: "Active",
    kind: "switch",
    section: "Status",
    colSpan: 1,
    defaultValue: true,
  },
];

export const integrationFields: FieldSchema[] = [
  {
    name: "name",
    label: "Integration",
    kind: "text",
    section: "Integration",
    isRequired: true,
    colSpan: 2,
  },
  { name: "type", label: "Type", kind: "text", section: "Integration", colSpan: 1 },
  { name: "endpoint", label: "Endpoint URL", kind: "text", section: "Integration", colSpan: 2 },
  {
    name: "isActive",
    label: "Enabled",
    kind: "switch",
    section: "Status",
    colSpan: 1,
    defaultValue: true,
  },
];

export const publicSiteFields: FieldSchema[] = [
  {
    name: "name",
    label: "Page title",
    kind: "text",
    section: "Page",
    isRequired: true,
    colSpan: 2,
  },
  {
    name: "slug",
    label: "Slug",
    kind: "text",
    section: "Page",
    colSpan: 1,
    placeholder: "about-us",
  },
  {
    name: "isPublished",
    label: "Published",
    kind: "switch",
    section: "Page",
    colSpan: 1,
    defaultValue: false,
  },
  { name: "body", label: "Body", kind: "textarea", section: "Content", colSpan: 2 },
];
