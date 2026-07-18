/**
 * @file screens.ts
 * @module @stackra/sdui/testing
 * @description A handful of canned `ISduiScreen` fixtures for tests
 *   that need real data.
 */

import type { ISduiScreen } from '@stackra/contracts';
import { SDUI_SCHEMA_VERSION } from '../core/constants/sdui-version.constant';

/** An empty screen with just a `Box` root. */
export const emptyScreen: ISduiScreen = {
  id: 'empty',
  path: '/empty',
  title: 'Empty',
  schemaVersion: SDUI_SCHEMA_VERSION,
  root: { id: 'root', type: 'Box' },
};

/** A hero screen with a Heading + Text + Button. */
export const heroScreen: ISduiScreen = {
  id: 'hero',
  path: '/hero',
  title: 'Hero',
  schemaVersion: SDUI_SCHEMA_VERSION,
  root: {
    id: 'root',
    type: 'Stack',
    props: { gap: 4 },
    slots: {
      children: [
        {
          id: 'title',
          type: 'Heading',
          props: { level: 1 as never, value: 'Welcome' },
        },
        {
          id: 'body',
          type: 'Text',
          props: { value: 'The framework is running.' },
        },
        {
          id: 'cta',
          type: 'Button',
          props: { color: 'primary' as never },
          slots: {
            children: [{ id: 'cta-label', type: 'Text', props: { value: 'Get started' } }],
          },
          actions: {
            onPress: [{ kind: 'toast', title: 'Clicked!', status: 'success' }],
          },
        },
      ],
    },
  },
};

/** A screen that references an unknown component (for diagnostic tests). */
export const unknownComponentScreen: ISduiScreen = {
  id: 'oops',
  path: '/oops',
  title: 'Oops',
  schemaVersion: SDUI_SCHEMA_VERSION,
  root: { id: 'root', type: 'SomethingNotRegistered' },
};

/** A screen with a version we don't support (for version-guard tests). */
export const outOfRangeScreen: ISduiScreen = {
  id: 'future',
  path: '/future',
  title: 'Future',
  schemaVersion: 999,
  root: { id: 'root', type: 'Box' },
};

export const sduiTestScreens = {
  empty: emptyScreen,
  hero: heroScreen,
  unknownComponent: unknownComponentScreen,
  outOfRange: outOfRangeScreen,
};
