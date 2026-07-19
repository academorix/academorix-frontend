# match

Full competitive-match lifecycle inside the Sports domain. Wave 2b sports
sub-module. Owns the four-stage state machine from scheduling through recap for
every sport the platform supports — one match model, one squad model, one event
stream, N scoring strategies resolved from the sports registry.

## 1. What this module owns

| Concern                | Owned artefact                                                                                                    |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Canonical fixture row  | `Match` — carries season, sport, team (or NULL for multi-team), branch, facility, opponent, kickoff, state.       |
| Multi-team support     | `MatchParticipant` — polymorphic team/athlete/opponent-ref rows for galas + festivals + swim meets.               |
| Squad + lineup         | `MatchSquadEntry` — athlete-per-match with role (starter/substitute/reserve/not_selected), shirt, formation slot. |
| Result recording       | `MatchResult` — per-participant final score / time / distance / apparatus; outcome (win / draw / loss); MOTM.     |
| In-match timeline      | `MatchEvent` — goals, cards, substitutions, apparatus scores, lane times, penalties.                              |
| Coach recap            | `MatchNote` — Markdown notes with visibility tier (coach_only / parents / public).                                |
| Opponent-logo cache    | `OpponentLogo` — reusable cache keyed by normalized opponent name; admin-searchable.                              |
| State machine          | `MatchStateTransitionValidator` — enforces SCHEDULED -> LINEUP_SET -> IN_PROGRESS -> COMPLETED + off-happy-paths. |
| Publish gate           | `LineupPublishGate` — refuses publish without a starter; refuses unpublish after IN_PROGRESS.                     |
| Sport-agnostic scoring | `ScoringStrategyResolver` — reads the sports registry (mechanism #4) to pick the columns / validation per sport.  |
| Recap propagation      | `NotifyMatchLineupPublishedJob` + `NotifyMatchResultPublishedJob` — family + public-site notifications.           |

### 1.1 A note on the primary class name

The primary Eloquent model is `MatchFixture`, not `Match` — `Match` is a PHP
8.0+ reserved keyword (the `match` expression) and cannot be used as a class
identifier. The blueprint folder stays `match/` and the domain vocabulary stays
"matches" everywhere else (URLs, permissions, events, ULID prefix `mat_`,
concept in docs). The table follows suit — `match_fixtures`, not `matches`.
Everything else in the module — `MatchParticipant`, `MatchSquadEntry`,
`MatchResult`, `MatchEvent`, `MatchNote`, `OpponentLogo` — uses names that are
valid PHP identifiers already, so no rename cascades from here.

### 1.2 The seven owned tables

- `match_fixtures` — canonical fixture row. Belongs to `Tenant` + `Season` +
  `Branch` + optional `Team` / `Competition` / `Facility` / `OpponentLogo`.
  Retained indefinitely.
- `match_participants` — multi-team meet participants. Belongs to `Tenant` +
  `MatchFixture` (CASCADE). Polymorphic ref to Team / Athlete / OpponentLogo.
- `match_squad_entries` — athlete-per-match roster. Belongs to `Tenant` +
  `MatchFixture` (CASCADE) + `Athlete` + `AthleteEnrollment` (RESTRICT).
- `match_results` — per-participant result. Belongs to `Tenant` + `MatchFixture`
  (CASCADE) + optional `MatchParticipant` (CASCADE).
- `match_events` — in-match timeline. Belongs to `Tenant` + `MatchFixture`
  (CASCADE). Optional athlete refs. Immutable post-create.
- `match_notes` — coach recap. Belongs to `Tenant` + `MatchFixture` (CASCADE) +
  authoring `User` (RESTRICT). SoftDeletes.
- `opponent_logos` — opponent-logo cache. Belongs to `Tenant`. Unique per
  (tenant_id, normalized_name).

None carry `application_id`, `region_id`, `organization_id`, or `scope_node_id`
— every row is tenant-scoped per `tenancy-columns.md` §3, with the forbidden
columns of §5 explicitly absent. Enforced by the tenancy-compliance-auditor.

## 2. The state machine

```
        ┌──────────────┐
        │  SCHEDULED   │
        └──────┬───────┘
               │ head_coach picks squad
               ▼
        ┌──────────────┐
        │  LINEUP_SET  │
        └──────┬───────┘
               │ POST /lineup/publish  (parent-facing view + notify)
               ▼
        ┌──────────────┐
        │ IN_PROGRESS  │◄─── kickoff_at reached OR coach starts timer
        └──────┬───────┘
               │ result recorded + published
               ▼
        ┌──────────────┐
        │  COMPLETED   │  (terminal)
        └──────────────┘

Off-happy-paths (from any pre-terminal state unless noted):
  * POSTPONED   — non-terminal; kickoff_at re-planned; re-notify.
  * CANCELLED   — terminal; preserved for audit.
  * ABANDONED   — terminal; only from IN_PROGRESS; partial events kept.
```

## 3. Sport-agnostic scoring

Every scoring column on `match_results` is nullable. The
`ScoringStrategyResolver` reads the match's `sport_key`, resolves the strategy
from the sports registry (mechanism #4), and picks which columns are required:

- **Score-based (football, basketball, hockey, water polo)** →
  `final_score_home` + `final_score_away` + optional `period_scores_json`.
- **Time-scored (swimming, athletics track)** → `time_recorded_seconds` +
  `period_scores_json` for splits.
- **Distance-scored (athletics field, javelin, discus)** →
  `distance_recorded_meters`.
- **Apparatus-scored (gymnastics)** → `apparatus_scores_json`.

Every sport can add its own dimensions via `metadata` without a schema change.

## 4. Multi-team meets

For galas / festivals / swim meets:

- `team_id` on the match IS NULL.
- `match_participants` holds one row per participating team / athlete / external
  opponent, with a `display_order` for rendering.
- `match_results` has one row per participant (each row's `participant_id`
  points at a `match_participants.id`).
- Squad entries still reference athletes but the match-level `team_id` narrows
  to the participants' aggregated squad.

## 5. Opponent-logo cache

`OpponentLogo` is a cross-match reuse cache keyed by
`(tenant_id, normalized_name)`. `normalized_name` is lowercased + trimmed +
diacritic-folded by the observer. Every match scheduled against an opponent hits
the cache; a miss creates a new row, a hit increments `search_frequency_count` +
bumps `last_used_at`.

The cache is admin-searchable — `GET /api/v1/opponent-logos?filter[search]=...`
returns the most-used matches for auto-complete on the match-creation form.

## 6. Cross-references

- `hierarchy.md` §7 — tier matrix (feature gating).
- `tenancy-columns.md` §3 — every match table carries `tenant_id`.
- `tenancy-columns.md` §5 — forbidden columns absent from every match row.
- `modules/sports/blueprints/registry/` — provides `sport_key` + scoring
  strategy resolution.
- `modules/sports/blueprints/season/` — provides `season_id`.
- `modules/sports/blueprints/athlete/` + `athlete-enrollment/` — squad
  eligibility.
- `modules/sports/blueprints/formations/` — formation-slot code registry.
- `modules/sports/blueprints/event/` — invitation + publish + notify surface
  when the match is one instance of a broader event.
- `modules/sports/blueprints/attendance/` — pre-filled attendance rows
  materialised from the published lineup.
- `modules/sports/blueprints/competition/` — standings recompute triggered by
  `MatchResultPublished`.
- `.ref/DOMAIN_MODULES_BLUEPRINT.md` §13.3 — the Matches specification this
  blueprint implements.
