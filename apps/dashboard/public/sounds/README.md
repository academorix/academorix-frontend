# Notification sounds

The in-app notification bell + toast pipeline plays a per-category sound
whenever a message lands with the tab focused (background pushes route through
the OS via the service worker instead — those honour the system's own sound
rules).

## Expected assets

Drop these files here at deploy time:

| File         | Purpose                     | Length  |
| ------------ | --------------------------- | ------- |
| `chime.mp3`  | Default confirmation        | ≤ 0.6 s |
| `bell.mp3`   | Emphasis (payment, billing) | ≤ 0.6 s |
| `knock.mp3`  | Attention (roster changes)  | ≤ 0.6 s |
| `urgent.mp3` | Escalation (safeguarding)   | ≤ 0.8 s |

The category → sound mapping lives in `settings-schema.json` under
`notifications.sounds.<category>` and defaults to `silent` when a user opts out.
When a file is missing, `NotificationSoundPlayer` silently skips the play call —
nothing else breaks.

## Format constraints

- **MP3, mono, 44.1 kHz, ≤ 32 KB per file**. Larger files won't break playback
  but will fight for bandwidth in slow networks.
- Trim leading silence — the player starts playing on receipt.
- No trailing DRM tags (some encoders inject a proprietary block at the tail
  that Safari refuses to decode).

## Where to source them

Any short royalty-free UI sound library works. Ping the design team for the
current preferred pack — the canonical set lives in the design system Figma
library.
