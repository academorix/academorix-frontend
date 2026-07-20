/**
 * @file consent-banner.component.tsx
 * @module @stackra/consent/react/components
 * @description ConsentBanner — a HeroUI-based GDPR/CCPA consent banner.
 *   Built entirely on `@stackra/ui` (HeroUI / HeroUI Pro) primitives — no
 *   custom CSS/classes, only Tailwind layout utilities for composition.
 *
 *   Visibility + accept/reject come from `useConsentBanner()`; per-category
 *   switches come from `useConsent()`. Category definitions are read from the
 *   DI `ConsentRegistry`.
 */

import { useState } from "react";
import { Button, Card, Switch } from "@stackra/ui/react";
import { useInject } from "@stackra/container/react";

import { CONSENT_REGISTRY } from "@/core/constants";
import { useConsent, useConsentBanner } from "@/react/hooks";
import type { ITranslatableLabel } from "@stackra/contracts";
import type { ConsentRegistry } from "@/core/services";
import type { ConsentBannerProps } from "@/react/interfaces";

/** Resolve a plain or locale-keyed label to a single string. */
function resolveLabel(label: ITranslatableLabel, locale: string): string {
  if (typeof label === "string") return label;
  return label[locale] ?? label.en ?? Object.values(label)[0] ?? "";
}

/**
 * ConsentBanner — a fixed bottom consent banner.
 *
 * Renders `null` until the user makes a decision is required (i.e. only when
 * `isVisible`). Offers "Accept all" / "Reject all" plus an expandable list of
 * per-category `Switch` toggles. Required categories render disabled and on.
 *
 * @example
 * ```tsx
 * <ConsentBanner locale="en" />
 * ```
 */
export function ConsentBanner({
  locale = "en",
  className,
  title = "We value your privacy",
  description = "We use cookies to enhance your experience, analyze traffic, and personalize content. Choose which categories you allow.",
}: ConsentBannerProps = {}) {
  const { isVisible, accept, reject } = useConsentBanner();
  const { hasConsent, grantConsent, revokeConsent } = useConsent();
  const registry = useInject<ConsentRegistry>(CONSENT_REGISTRY);

  const [showDetails, setShowDetails] = useState(false);

  if (!isVisible) return null;

  const categories = registry.getCategories();

  return (
    <div className={className}>
      <Card className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-3xl">
        <Card.Header>
          <Card.Title>{title}</Card.Title>
          <Card.Description>{description}</Card.Description>
        </Card.Header>

        {showDetails ? (
          <Card.Content>
            <div className="flex flex-col gap-3">
              {categories.map((category) => (
                <Switch
                  key={category.slug}
                  isSelected={category.required ? true : hasConsent(category.slug)}
                  isDisabled={category.required}
                  onChange={(selected) =>
                    selected ? grantConsent(category.slug) : revokeConsent(category.slug)
                  }
                >
                  <Switch.Content>
                    <Switch.Control>
                      <Switch.Thumb />
                    </Switch.Control>
                    {resolveLabel(category.label, locale)}
                  </Switch.Content>
                </Switch>
              ))}
            </div>
          </Card.Content>
        ) : null}

        <Card.Footer className="flex flex-wrap items-center justify-end gap-2">
          <Button variant="ghost" onPress={() => setShowDetails((prev) => !prev)}>
            {showDetails ? "Hide details" : "Customize"}
          </Button>
          <Button variant="outline" onPress={reject}>
            Reject all
          </Button>
          <Button onPress={accept}>Accept all</Button>
        </Card.Footer>
      </Card>
    </div>
  );
}
