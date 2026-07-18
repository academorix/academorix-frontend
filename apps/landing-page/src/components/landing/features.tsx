import { Card } from "@heroui/react";
import { motion, useReducedMotion } from "motion/react";

import { useI18n } from "../../i18n";
import { Iconify } from "../../icons/iconify";

type Feature = {
  icon: string;
  /** Dictionary key prefix — resolves to `<key>.title`, `<key>.description`, and `<key>.point1..3`. */
  key: "scheduling" | "communication" | "invoicing";
};

// WHY the key-based shape: keeping the component data-driven means adding a
// new feature is a single entry here + three point keys in `dictionaries.ts`,
// with `useI18n().t()` doing the locale switch for both English and Arabic.
const features: Feature[] = [
  { icon: "calendar", key: "scheduling" },
  { icon: "comments", key: "communication" },
  { icon: "receipt", key: "invoicing" },
];

function FeatureCard({ feature, index }: { feature: Feature; index: number }) {
  const reduceMotion = useReducedMotion();
  const { t } = useI18n();

  const points = [
    t(`features.${feature.key}.point1`),
    t(`features.${feature.key}.point2`),
    t(`features.${feature.key}.point3`),
  ];

  return (
    <motion.div
      className="h-full"
      {...(reduceMotion
        ? {}
        : {
            initial: { opacity: 0, y: 20 },
            whileInView: { opacity: 1, y: 0 },
            viewport: { once: true, margin: "-80px" },
            transition: { duration: 0.5, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] as const },
          })}
    >
      <Card className="group h-full border border-border transition-all duration-300 hover:-translate-y-1 hover:border-accent hover:shadow-[0_24px_50px_-30px_rgba(15,23,42,0.4)]">
        <div className="flex size-11 items-center justify-center rounded-xl bg-surface-secondary text-foreground transition-colors duration-300 group-hover:bg-accent group-hover:text-accent-foreground">
          <Iconify className="size-5" icon={feature.icon} />
        </div>
        <Card.Header className="mt-4">
          <Card.Title className="font-display text-xl font-semibold">
            {t(`features.${feature.key}.title`)}
          </Card.Title>
          <Card.Description className="mt-1.5 text-sm leading-relaxed text-muted">
            {t(`features.${feature.key}.description`)}
          </Card.Description>
        </Card.Header>
        <Card.Content className="mt-4">
          <ul className="space-y-2.5">
            {points.map((point) => (
              <li key={point} className="flex items-center gap-2.5 text-sm">
                <Iconify
                  className="size-4 shrink-0 rounded-full bg-accent p-0.5 text-accent-foreground"
                  icon="check"
                />
                <span className="text-foreground">{point}</span>
              </li>
            ))}
          </ul>
        </Card.Content>
      </Card>
    </motion.div>
  );
}

export function Features() {
  const { t } = useI18n();

  return (
    <section className="border-t border-border" id="features">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-6 lg:py-28">
        <div className="max-w-2xl">
          <p className="inline-block rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-accent-foreground">
            {t("features.eyebrow")}
          </p>
          <h2 className="font-display mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            {t("features.title")}
          </h2>
          <p className="mt-4 text-lg text-muted">{t("features.subtitle")}</p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {features.map((feature, index) => (
            <FeatureCard key={feature.key} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
