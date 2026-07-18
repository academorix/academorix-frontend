import { Button } from "@heroui/react";
import { motion, useReducedMotion } from "motion/react";

import { useI18n } from "../../i18n";
import { Iconify } from "../../icons/iconify";

export function CtaBand() {
  const reduceMotion = useReducedMotion();
  const { t } = useI18n();

  const highlights = [t("ctaBand.point1"), t("ctaBand.point2"), t("ctaBand.point3")];

  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-6 lg:py-24">
        <motion.div
          className="relative overflow-hidden rounded-3xl bg-foreground px-6 py-14 text-center text-background sm:px-12 sm:py-16"
          {...(reduceMotion
            ? {}
            : {
                initial: { opacity: 0, y: 24 },
                whileInView: { opacity: 1, y: 0 },
                viewport: { once: true, margin: "-80px" },
                transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
              })}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 left-1/2 size-72 -translate-x-1/2 rounded-full bg-accent/25 blur-3xl"
          />
          <h2 className="font-display relative mx-auto max-w-2xl text-3xl font-extrabold tracking-tight sm:text-4xl">
            {t("ctaBand.title")}
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-lg text-background/70">
            {t("ctaBand.subtitle")}
          </p>
          <div className="relative mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" variant="primary">
              {t("common.startFreeTrial")}
              <Iconify className="size-4 rtl:rotate-180" icon="arrow-right" />
            </Button>
            <Button
              className="border-background/30 text-background hover:bg-background/10"
              size="lg"
              variant="outline"
            >
              {t("common.talkToSales")}
            </Button>
          </div>
          <ul className="relative mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-background/70">
            {highlights.map((item) => (
              <li key={item} className="flex items-center gap-1.5">
                <Iconify className="size-4 text-accent" icon="circle-check-fill" />
                {item}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
}
