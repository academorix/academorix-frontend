# localization — changelog

## [Unreleased] — inception

- Localization platform authored. Four entities: `Language`, `WorkspaceLocale`, `Translation`, `TranslationJob`.
- Decorator over Laravel's `Translator` — DB cache lookup precedes file lookup.
- Locale resolution middleware with 7-step precedence chain.
- Machine translation drivers: OpenAI, Google Cloud Translation, DeepL, AWS Translate, Azure Translator, plus a null driver for tests.
- Helper overrides: `t()`, `__()`, `trans()`, `trans_choice()` — full Laravel API preserved (placeholders, plurals, array returns, dot notation, JSON files).
- `#[Translatable]` attribute for Eloquent property translation.
- `HasTranslations` trait for models with translated columns.
- RTL-aware via `Language.direction`.
- Entitlements for locale count + monthly AI translation quota.

### Compatibility

- Depends on `foundation`, `workspaces`, `activity`, `entitlements`.
- Inception release.
