import { Avatar } from "@heroui/react";
import { motion, useReducedMotion } from "motion/react";

import { useI18n } from "../../i18n";

// Academy names are proper nouns; we keep them in Latin so the brand logos read
// consistently in either locale. Only the surrounding chrome is translated.
const academies = [
  { name: "Riverside Aquatics", initials: "RA" },
  { name: "Apex Gymnastics", initials: "AG" },
  { name: "Northgate FC", initials: "NF" },
  { name: "Summit Athletics", initials: "SA" },
  { name: "Vertex Martial Arts", initials: "VM" },
  { name: "Coastline Tennis", initials: "CT" },
];

/** Stat values stay language-agnostic; labels flip via `t()`. */
const STATS = [
  { value: "400+", labelKey: "proof.stat.academies" },
  { value: "1.2M", labelKey: "proof.stat.sessions" },
  { value: "$90M", labelKey: "proof.stat.tuition" },
  { value: "8 hrs", labelKey: "proof.stat.savings" },
] as const;

export function Proof() {
  const reduceMotion = useReducedMotion();
  const { t } = useI18n();

  return (
    <section className="border-t border-border" id="customers">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-6 lg:py-28">
        <p className="text-center text-xs font-medium tracking-wide text-muted uppercase">
          {t("proof.trustedBy")}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-5">
          {academies.map((academy) => (
            <div key={academy.name} className="flex items-center gap-2.5 text-muted">
              <span className="flex size-8 items-center justify-center rounded-lg border border-border text-xs font-bold">
                {academy.initials}
              </span>
              <span className="font-display text-sm font-semibold">{academy.name}</span>
            </div>
          ))}
        </div>

        <div className="mt-16 grid items-stretch gap-6 lg:grid-cols-[1.4fr_1fr]">
          <motion.figure
            className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-8 sm:p-10"
            {...(reduceMotion
              ? {}
              : {
                  initial: { opacity: 0, y: 20 },
                  whileInView: { opacity: 1, y: 0 },
                  viewport: { once: true, margin: "-80px" },
                  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
                })}
          >
            <blockquote className="font-display text-2xl leading-snug font-semibold tracking-tight text-foreground sm:text-3xl">
              {t("proof.quote")}
            </blockquote>
            <figcaption className="mt-8 flex items-center gap-3">
              <Avatar color="accent" variant="soft">
                <Avatar.Fallback>EM</Avatar.Fallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold text-foreground">{t("proof.quoteAuthor")}</p>
                <p className="text-sm text-muted">{t("proof.quoteRole")}</p>
              </div>
            </figcaption>
          </motion.figure>

          <div className="grid grid-cols-2 gap-4">
            {STATS.map((stat, index) => (
              <motion.div
                key={stat.labelKey}
                className="flex flex-col justify-center rounded-2xl border border-border bg-surface p-6"
                {...(reduceMotion
                  ? {}
                  : {
                      initial: { opacity: 0, y: 16 },
                      whileInView: { opacity: 1, y: 0 },
                      viewport: { once: true, margin: "-60px" },
                      transition: {
                        duration: 0.45,
                        delay: index * 0.06,
                        ease: [0.22, 1, 0.36, 1] as const,
                      },
                    })}
              >
                <p className="font-display text-3xl font-extrabold tracking-tight text-foreground">
                  {stat.value}
                </p>
                <p className="mt-2 text-sm leading-tight text-muted">{t(stat.labelKey)}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
