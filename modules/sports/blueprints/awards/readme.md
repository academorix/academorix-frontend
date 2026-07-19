# awards

Recognition + certificates per blueprint §14.7. Wave 4.

## Owned entities

- `Award` (`awd_`) — recognition instance with type + evidence + auto-grant
  flag.
- `Certificate` (`crt_`) — rendered PDF cert with shareable signed URL.

## Auto-grant subscribers

- `BeltRankPromoted` → grants `belt_promotion` award.
- `AttendanceStreakReached` → grants `attendance_streak_N` award.
- `BenchmarkBroken` → grants `benchmark_broken` award.
- `GoalAchieved` → grants `goal_achieved` award.
- `CompetitionCompleted` + winner → grants `tournament_winner` award.
- `MatchResultRecorded` + MOTM → grants `motm` award.

## ULID prefixes

- `awd_`, `crt_`
