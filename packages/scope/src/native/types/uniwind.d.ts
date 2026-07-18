/**
 * @file uniwind.d.ts
 * @module @stackra/scope/native/types
 * @description Ambient type augmentation for React Native + Uniwind /
 *   NativeWind.
 *
 *   HeroUI Native components accept a `className` prop compiled to
 *   native styles by Uniwind (Tailwind CSS for React Native). React
 *   Native's core `ViewProps` / `TextProps` do NOT declare `className`
 *   in stock types — this module adds it so our native components using
 *   layout primitives (`View`, `Text`) carry passthrough Tailwind layout
 *   utilities the same way HeroUI's own examples do.
 *
 *   Consumer apps that already run Uniwind / NativeWind ship an
 *   equivalent augmentation; the same property added twice is safely
 *   merged by TypeScript.
 */

import 'react-native';

declare module 'react-native' {
  interface ViewProps {
    className?: string;
  }

  interface TextProps {
    className?: string;
  }

  interface PressableProps {
    className?: string;
  }
}
