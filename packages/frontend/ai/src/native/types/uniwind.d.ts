/**
 * @file uniwind.d.ts
 * @module @stackra/ai/native/types
 * @description Ambient type augmentation for React Native + Uniwind /
 *   NativeWind.
 *
 *   HeroUI Native's OSS + Pro components accept a `className` prop that
 *   is compiled to native styles by Uniwind (Tailwind CSS for React
 *   Native). React Native's core `ViewProps` / `TextProps` /
 *   `ScrollViewProps` do NOT declare `className` in stock types — this
 *   module adds it so our native components using layout primitives
 *   (`View`, `ScrollView`, `Text`) can carry passthrough Tailwind layout
 *   utilities the same way HeroUI's own examples do.
 *
 *   Consumer apps that already run Uniwind / NativeWind ship an
 *   equivalent augmentation; the same property added twice is safely
 *   merged by TypeScript.
 */

import 'react-native';

declare module 'react-native' {
  // Layout container.
  interface ViewProps {
    className?: string;
  }

  // Text primitive.
  interface TextProps {
    className?: string;
  }

  // ScrollView + its inner content container.
  interface ScrollViewProps {
    className?: string;
    contentContainerClassName?: string;
  }

  // Text input primitives (used by HeroUI Native's Input/TextArea internally
  // and by our composer's fallback when a raw TextInput is composed in).
  interface TextInputProps {
    className?: string;
  }

  // Pressable + touchable primitives — HeroUI Native's PressableFeedback
  // wraps them and forwards className, so we augment for completeness.
  interface PressableProps {
    className?: string;
  }
}
