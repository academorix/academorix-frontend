# Runbook — `<service-name>`

> Copy this file to `docs/runbooks/<service-name>.md` and fill in every TODO
> block. Owning agent: `sre-lead`.

## Metadata

- **Service:** `<service-name>` (matches `catalog.json` `name`)
- **Severity band:** SEV-1 / SEV-2 / SEV-3 — TODO
- **On-call rotation:** `<rotation-name>` in PagerDuty — TODO
- **Escalation contact:** `<lead>` (Slack: `@handle`) — TODO
- **Related SLO:** `docs/slos/<service-name>.md` (99.9% availability) — TODO
- **Related dashboard:** [Grafana → Service Health](https://grafana.example.com/d/PLACEHOLDER)
- **Last reviewed:** `YYYY-MM-DD` — TODO

## Summary

TODO(sre-lead): one paragraph. What does this service do, and what makes it
runbook-worthy? Example: "Coordinates outbound webhook delivery to tenant-owned
URLs. Runbook exists because failed deliveries page on-call and the retry queue
can back up."

## Alert conditions

TODO(sre-lead): list every alert that pages this runbook, with the condition
and the diagnostic panel to check first.

- **`High 5xx rate — webhook dispatcher`** → PagerDuty
  - Fires when: 5xx rate above 5% for 5 minutes
  - Dashboard: [Webhook Health / Error Rate panel](https://grafana.example.com/...)
- **`Retry backlog growing — webhook queue`** → Slack `#ops-alerts`
  - Fires when: `webhook_retry_depth > 10_000` for 15 minutes
  - Dashboard: [Webhook Health / Queue Depth panel](https://grafana.example.com/...)

## Likely causes

TODO(sre-lead): the top 3-5 causes of the alert firing, ranked by frequency.

1. **Downstream tenant URLs returning 5xx.** Check the delivery log for a
   pattern by tenant.
2. **Signing-secret rotation half-applied.** Check `signing_key_version` mix
   in delivery log.
3. **Rate limiter mis-tuned.** Check `429` bucket in the health dashboard.

## Immediate mitigations

TODO(sre-lead): each mitigation gets a numbered step, a rough time cost, and
the exact command / dashboard to use.

1. **Pause fan-out for the affected tenant** (2 min)
   ```sh
   # Placeholder command
   php artisan webhook:disable --tenant=<tenant-id>
   ```

2. **Drain the retry queue back to zero if backed up** (5-15 min)
   ```sh
   php artisan queue:retry --queue=webhooks --limit=1000
   ```

3. **Roll back to the previous release if the issue is deploy-related** (5 min)
   - Run `pnpm --filter <service> release:rollback` (via the release-manager
     agent's playbook)

## Diagnostic queries

TODO(sre-lead): copy-paste Prometheus / Loki / Grafana queries to answer the
top diagnostic questions.

- **"Which tenants are failing?"**
  ```
  topk(10, sum by (tenant_id) (rate(webhook_delivery_failed_total[5m])))
  ```

- **"When did the error rate spike?"**
  ```
  {service="webhook-dispatcher"} |= "level=error"
    | line_format "{{ .timestamp }} {{ .tenant_id }} {{ .error_code }}"
    | limit 200
  ```

## Rollback

TODO(sre-lead): every rollback procedure the on-call might need — deploy
rollback, config-flag disable, feature-flag kill switch. Link the exact
runbook step.

- **Deploy rollback:** `pnpm --filter <service> release:rollback` reverts to
  the previous canary + full deploy.
- **Feature-flag kill switch:** disable `webhook_dispatch_v2` in Doppler dev,
  redeploy.
- **Data rollback:** N/A — webhook delivery is fire-and-forget, no state to
  restore.

## Escalation path

TODO(sre-lead): who to page, at what response time.

| Severity | First responder     | Escalate after | Escalate to             |
| -------- | ------------------- | -------------- | ----------------------- |
| SEV-1    | On-call primary     | 15 min         | Incident commander      |
| SEV-2    | On-call primary     | 60 min         | SRE lead                |
| SEV-3    | On-call primary     | Next biz day   | Service owner           |

## Post-incident

TODO(sre-lead): the standard post-incident checklist. Reference the incident
retro template.

- [ ] Timeline captured with UTC timestamps
- [ ] Root cause documented
- [ ] Action items with owners + deadlines assigned
- [ ] Post-mortem doc reviewed with `sre-lead` + service owner
- [ ] Runbook updated with any new mitigations discovered
- [ ] Test / alert added if the failure mode wasn't caught before

## Related documents

- SLO definition: `docs/slos/<service-name>.md`
- Architecture ADR: `docs/adr/00XX-<service-name>-architecture.md`
- Threat model: `docs/security/threat-models/<service-name>.md`
- Service catalog entry: `packages/backend/<bucket>/<name>/catalog.json`
