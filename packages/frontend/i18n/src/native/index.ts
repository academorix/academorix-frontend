/**
 * @file index.ts
 * @module @stackra/i18n/native
 * @description React Native i18n subpath — native adapters, device locale detection,
 *   AsyncStorage persistence, RTL management, and NativeI18nModule.
 */

// ============================================================================
// Module
// ============================================================================

export { NativeI18nModule } from './native-i18n.module';

// ============================================================================
// Adapters (native-only). Locale storage is unified in `@stackra/i18n/core`
// via `StorageBackedLocaleAdapter` — no separate native adapter shipped.
// ============================================================================

export { NativeDirectionAdapter } from './adapters';

// ============================================================================
// Resolvers
// ============================================================================

export { DeviceLocaleResolver } from './resolvers';

// ============================================================================
// Components (built on @stackra/ui/native)
// ============================================================================

export { NativeLanguageSelector } from './components';

// ============================================================================
// Interfaces (component props + adapter options)
// ============================================================================

export type { NativeLanguageSelectorProps, NativeLocaleItem } from './interfaces';

// ============================================================================
// Re-exports from core (convenience)
// ============================================================================

export { I18nModule } from '../core/i18n.module';
export { I18nManager, I18nLocaleService, DirectionService } from '../core/services';
export { StaticLoader } from '../core/loaders';
export { isRtlLocale, getDirection } from '../core/utils';

// ============================================================================
// Cross-platform hooks (single source in core/hooks — safe for RN)
// ============================================================================

export { useI18n, useLocale, useDirection, useFormat } from '../core/hooks';
export type {
  UseI18nReturn,
  UseLocaleReturn,
  UseDirectionReturn,
  IUseFormatReturn,
} from '../core/interfaces';

// ============================================================================
// Non-hook helpers
// ============================================================================

export { __, setDefaultTranslator } from '../core/utils/translate.util';
