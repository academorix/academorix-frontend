# development

Talent pathways + scouting + IDP per blueprint §14.4. Wave 3.

## Owned entities

- `DevelopmentPathway` (`dvp_`) — Foundation → Youth Dev → Youth Team → Senior.
- `PathwayStage` (`dvs_`) — ordered stage with attribute-driven promotion
  criteria.
- `ScoutingReport` (`sct_`) — coach/scout observation with rating + tags.
- `TalentFlag` (`tfg_`) — talent-ID signal feeding promotion queue.
- `Goal` (`gol_`) — IDP goal reviewable each term.

## Promotion evaluation

`PromotionEvaluator` reads Progress + Performance results against each stage's
`criteria` JSONB (attribute-driven) and produces a `ReadyForPromotion` list. The
head coach reviews + approves the promotion, moving the athlete from stage N to
stage N+1.

## ULID prefixes

- `dvp_`, `dvs_`, `sct_`, `tfg_`, `gol_`
