import { Button, Chip } from "@heroui/react";
import { motion, useReducedMotion } from "motion/react";
import { Link as RouterLink } from "react-router";

import { Iconify } from "../../icons/iconify";
import { useI18n } from "../../i18n";
import { ProductPreview } from "./product-preview";

const SPORT_KEYS = [
  "swimming",
  "gymnastics",
  "soccer",
  "tennis",
  "athletics",
  "martial-arts",
] as const;

export function Hero() {
  const reduceMotion = useReducedMotion();
  const { t } = useI18n();

  const fade = (delay: number) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] as const },
        };

  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-gradient-to-b from-surface-secondary to-transparent"
      />
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 pt-16 pb-14 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-10 lg:pt-24 lg:pb-20">
        <div className="max-w-xl">
          <motion.div {...fade(0)}>
            <Chip color="accent" size="sm" variant="soft">
              <span className="size-1.5 rounded-full bg-accent" />
              {t("hero.badge")}
            </Chip>
          </motion.div>

          <motion.h1
            className="font-display mt-5 text-4xl leading-[1.03] font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl"
            {...fade(0.06)}
          >
            {t("hero.title")}
          </motion.h1>

          <motion.p className="mt-5 text-lg leading-relaxed text-muted" {...fade(0.12)}>
            {t("hero.subtitle")}
          </motion.p>

          <motion.div className="mt-7 flex flex-wrap items-center gap-3" {...fade(0.18)}>
            <Button
              render={(props) => <RouterLink to="/create-workspace" {...(props as object)} />}
              size="lg"
              variant="primary"
            >
              {t("common.startFreeTrial")}
              <Iconify className="size-4 rtl:rotate-180" icon="arrow-right" />
            </Button>
            <Button
              render={(props) => <RouterLink to="/contact-sales" {...(props as object)} />}
              size="lg"
              variant="outline"
            >
              <Iconify className="size-4" icon="play" />
              {t("common.bookDemo")}
            </Button>
          </motion.div>

          <motion.div className="mt-8" {...fade(0.24)}>
            <p className="text-xs font-medium tracking-wide text-muted uppercase">
              {t("hero.sportsLabel")}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {SPORT_KEYS.map((slug) => (
                <span
                  key={slug}
                  className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted"
                >
                  {t(`sport.${slug}`)}
                </span>
              ))}
            </div>
          </motion.div>
        </div>

        <motion.div
          {...(reduceMotion
            ? {}
            : {
                initial: { opacity: 0, y: 24, scale: 0.98 },
                animate: { opacity: 1, y: 0, scale: 1 },
                transition: { duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] as const },
              })}
        >
          <ProductPreview />
        </motion.div>
      </div>
    </section>
  );
}
