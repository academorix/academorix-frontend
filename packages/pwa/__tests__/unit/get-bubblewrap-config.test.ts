/**
 * @file get-bubblewrap-config.test.ts
 * @module @stackra/pwa/__tests__/unit
 * @description Tests for {@link getBubblewrapConfig}.
 */

import { describe, expect, it } from 'vitest';

import { getBubblewrapConfig } from '@/twa';

const INPUT = {
  host: 'app.stackra.com',
  name: 'Stackra',
  launcherName: 'Stackra',
  manifestUrl: 'https://app.stackra.com/manifest.webmanifest',
  startUrl: '/',
  themeColor: '#0EA5E9',
  backgroundColor: '#FFFFFF',
  iconUrl: 'https://app.stackra.com/pwa-512.png',
} as const;

describe('getBubblewrapConfig — required fields', () => {
  it('emits host / name / launcherName / start URL', () => {
    const c = getBubblewrapConfig(INPUT);
    expect(c.host).toBe('app.stackra.com');
    expect(c.name).toBe('Stackra');
    expect(c.launcherName).toBe('Stackra');
    expect(c.startUrl).toBe('/');
    expect(c.webManifestUrl).toBe(INPUT.manifestUrl);
  });

  it('emits the icon URL', () => {
    const c = getBubblewrapConfig(INPUT);
    expect(c.iconUrl).toBe(INPUT.iconUrl);
  });

  it('emits theme / background / navigation colours', () => {
    const c = getBubblewrapConfig(INPUT);
    expect(c.themeColor).toBe('#0EA5E9');
    expect(c.backgroundColor).toBe('#FFFFFF');
    // Default navigationColor falls back to themeColor.
    expect(c.navigationColor).toBe('#0EA5E9');
    expect(c.navigationColorDark).toBe('#000000');
  });
});

describe('getBubblewrapConfig — derived application id', () => {
  it('derives packageId from host (reverse-DNS + .twa suffix)', () => {
    expect(getBubblewrapConfig(INPUT).packageId).toBe('com.stackra.app.twa');
  });

  it('honours an explicit applicationId override', () => {
    expect(getBubblewrapConfig({ ...INPUT, applicationId: 'io.stackra.app' }).packageId).toBe(
      'io.stackra.app'
    );
  });

  it('lowercases the host before deriving', () => {
    expect(getBubblewrapConfig({ ...INPUT, host: 'APP.Stackra.com' }).packageId).toBe(
      'com.stackra.app.twa'
    );
  });
});

describe('getBubblewrapConfig — defaults', () => {
  it('defaults display to standalone and orientation to any', () => {
    const c = getBubblewrapConfig(INPUT);
    expect(c.display).toBe('standalone');
    expect(c.orientation).toBe('any');
  });

  it('defaults minSdkVersion to 21', () => {
    expect(getBubblewrapConfig(INPUT).minSdkVersion).toBe(21);
  });

  it('defaults version code / name', () => {
    const c = getBubblewrapConfig(INPUT);
    expect(c.appVersionCode).toBe(1);
    expect(c.appVersionName).toBe('1.0.0');
  });

  it('enables notifications by default', () => {
    expect(getBubblewrapConfig(INPUT).enableNotifications).toBe(true);
  });

  it('marks the generator as @stackra/pwa', () => {
    expect(getBubblewrapConfig(INPUT).generatorApp).toBe('@stackra/pwa');
  });

  it('emits customtabs fallbackType', () => {
    expect(getBubblewrapConfig(INPUT).fallbackType).toBe('customtabs');
  });

  it('emits empty shortcuts by default', () => {
    expect(getBubblewrapConfig(INPUT).shortcuts).toEqual([]);
  });
});

describe('getBubblewrapConfig — optional fields', () => {
  it('spreads shortcuts when provided', () => {
    const c = getBubblewrapConfig({
      ...INPUT,
      shortcuts: [{ name: 'Inbox', shortName: 'In', url: '/inbox', iconUrl: '/inbox.png' }],
    });
    expect(c.shortcuts).toEqual([
      { name: 'Inbox', shortName: 'In', url: '/inbox', iconUrl: '/inbox.png' },
    ]);
  });

  it('emits maskable and monochrome icons when provided', () => {
    const c = getBubblewrapConfig({
      ...INPUT,
      maskableIconUrl: 'https://x/mask.png',
      monochromeIconUrl: 'https://x/mono.png',
    });
    expect(c.maskableIconUrl).toBe('https://x/mask.png');
    expect(c.monochromeIconUrl).toBe('https://x/mono.png');
  });

  it('emits signing key when either path or alias is provided', () => {
    const c = getBubblewrapConfig({
      ...INPUT,
      signing: { keystorePath: './keystore.jks', keyAlias: 'stackra' },
    });
    expect(c.signingKey).toEqual({ path: './keystore.jks', alias: 'stackra' });
  });

  it('omits signingKey when neither path nor alias is provided', () => {
    const c = getBubblewrapConfig({ ...INPUT, signing: {} });
    expect('signingKey' in c).toBe(false);
  });
});
