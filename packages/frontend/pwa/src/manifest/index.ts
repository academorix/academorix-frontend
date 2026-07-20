/**
 * @file index.ts
 * @module @stackra/pwa/manifest
 * @description Public API for the Web App Manifest builder.
 *
 *   The builder is pure and dependency-free — call it from
 *   `vite.config.ts`, a Next.js `manifest.ts`, or any Node script.
 */

export { buildManifest } from "./utils";
export type {
  IManifestIcon,
  IManifestShortcut,
  IManifestScreenshot,
  IManifestTranslation,
  IWebAppManifest,
  ManifestDisplayMode,
  IBuildManifestInput,
  IRelatedApplication,
  ILaunchHandler,
  LaunchHandlerClientMode,
  IFileHandler,
  IProtocolHandler,
  IUrlHandler,
  IShareTarget,
  IShareTargetParams,
  IShareTargetFile,
  IWidget,
} from "./interfaces";
