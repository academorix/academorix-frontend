# Architecture Decision Records

This directory records the significant architectural decisions made in the
Stackra frontend (and the accompanying blueprint / backend surface it
describes). Every ADR follows the same shape used by the sibling
`stackra-backend/` repository — Context, Options, Decision, Consequences,
Related work.

## Numbering + supersession

- Sequential numbering. Every number is used; there are no gaps.
- Never delete an ADR. To reverse a decision, ship a new ADR that supersedes the
  old one and update the old ADR's header with
  `**Superseded by:** [ADR NNNN](NNNN-<slug>.md)`.
- Status transitions: `Proposed` → `Accepted` → `Deprecated` /
  `Superseded by ADR NNNN`.

## Index

Rows 0001–0023 originate at `stackra-backend/docs/adr/` and are cross-
referenced across `.kiro/agents/*.md` and `.kiro/steering/*.md`. This working
directory adds ADR 0024 onward; when this tree consolidates back into
`stackra-backend/`, the numbering stays continuous.

| #                                           | Title                                                                                        | Status   |
| ------------------------------------------- | -------------------------------------------------------------------------------------------- | -------- |
| 0001–0023                                   | See `stackra-backend/docs/adr/README.md`                                                  | Accepted |
| [0024](0024-enrollment-funnel-not-a-crm.md) | Enrollment funnel is not a CRM (drop `growth/crm-leads`, absorb into `sports/registrations`) | Accepted |
| [0025](0025-integrations-two-lane-model.md) | Integrations two-lane model — provider slots now, marketplace app substrate for later        | Accepted |

The next available number is **0026**.
