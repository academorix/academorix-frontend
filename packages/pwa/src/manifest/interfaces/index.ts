/**
 * @file index.ts
 * @module @stackra/pwa/manifest/interfaces
 * @description Barrel export for manifest-builder interfaces.
 */

export type { IManifestIcon } from './manifest-icon.interface';
export type { IManifestShortcut } from './manifest-shortcut.interface';
export type { IManifestScreenshot } from './manifest-screenshot.interface';
export type { IManifestTranslation } from './manifest-translation.interface';
export type { IWebAppManifest, ManifestDisplayMode } from './web-app-manifest.interface';
export type { IBuildManifestInput } from './build-manifest-input.interface';
export type { IRelatedApplication } from './related-application.interface';
export type { ILaunchHandler, LaunchHandlerClientMode } from './launch-handler.interface';
export type { IFileHandler } from './file-handler.interface';
export type { IProtocolHandler } from './protocol-handler.interface';
export type { IUrlHandler } from './url-handler.interface';
export type { IShareTarget } from './share-target.interface';
export type { IShareTargetParams } from './share-target-params.interface';
export type { IShareTargetFile } from './share-target-file.interface';
export type { IWidget } from './widget.interface';
