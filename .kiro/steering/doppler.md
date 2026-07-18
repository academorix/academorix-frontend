---
inclusion: fileMatch
fileMatchPattern: ["**/.env*", "**/composer.json", "**/config/*.php"]
---

# Doppler

Every runtime secret comes from Doppler. See `docs/doppler.md` for the full
design. Rules the agent must follow:

- Never write a real secret value into any file in this repo.
- Never suggest adding `.env` (real values) to git — only `.env.example`
  (placeholders) may be committed.
- When adding a new env var, update **both**:
  - `apps/<name>/.env.example` (documentation of what the var is)
  - The corresponding Doppler config (via `doppler secrets set` or the
    dashboard)
- When wrapping a new script in Doppler, use `doppler run --` — the `--` is
  mandatory to separate Doppler flags from the wrapped command's args.
- New apps: copy `apps/template/.doppler.yaml`, change the `config:` line to
  `dev_<app-name>`, then run `./scripts/doppler-init.sh` from the monorepo root
  to create the server-side branch configs.
