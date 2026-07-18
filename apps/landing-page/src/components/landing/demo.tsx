import { useState } from "react";

import { Chip } from "@heroui/react";
import { Segment } from "@heroui-pro/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { useI18n } from "../../i18n";
import { Iconify } from "../../icons/iconify";

const swimming =
  "https://files.instantdb.com/fd13e78a-1a89-44ed-b1f3-3500218ed3f0/4/1129b792-b3ef-4aca-8a66-82939fed51e2?response-cache-control=public%2C%20max-age%3D86400%2C%20immutable&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9maWxlcy5pbnN0YW50ZGIuY29tL2ZkMTNlNzhhLTFhODktNDRlZC1iMWYzLTM1MDAyMThlZDNmMC80LzExMjliNzkyLWIzZWYtNGFjYS04YTY2LTgyOTM5ZmVkNTFlMj9yZXNwb25zZS1jYWNoZS1jb250cm9sPXB1YmxpYyUyQyUyMG1heC1hZ2UlM0Q4NjQwMCUyQyUyMGltbXV0YWJsZSIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc4NDE2MDAwMH19fV19&Signature=aqd5JGEr7OOisQFLU5nAWUS4I~RRFx-PG25FD6mA7XKZO2PkYE~ipaUOdQpiyCAHBizjqALTr-799-Ytpp2qMTPHRqjw184KMQrDJt3W8pZvnHvj6dw9oLgTLEmSEHgjW07Lt0eiGdefERwLtWevJyH3sGDnays3hapnzq0QdHvtuM7UwAbWodxrGSHtTWW1c4APkpp8P6BVWC8pjqhXhrqMjD1kQAZyexYiNGs~m07LXvkZynAErtkVhrB-SfX5v6OfPIiWADi5kI87Ue6yEyWkYnAn5wgOaD0VVKrW31Bd8jkG0I~VR0xk6ipa5G888TUFc5Cbolo6A7Q0aQjYkw&Key-Pair-Id=K2D8SOWYIPDBRT";
const gymnastics =
  "https://files.instantdb.com/fd13e78a-1a89-44ed-b1f3-3500218ed3f0/6/2704875e-7318-45e8-8403-0da5a5ce6ea4?response-cache-control=public%2C%20max-age%3D86400%2C%20immutable&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9maWxlcy5pbnN0YW50ZGIuY29tL2ZkMTNlNzhhLTFhODktNDRlZC1iMWYzLTM1MDAyMThlZDNmMC82LzI3MDQ4NzVlLTczMTgtNDVlOC04NDAzLTBkYTVhNWNlNmVhND9yZXNwb25zZS1jYWNoZS1jb250cm9sPXB1YmxpYyUyQyUyMG1heC1hZ2UlM0Q4NjQwMCUyQyUyMGltbXV0YWJsZSIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc4NDE2MDAwMH19fV19&Signature=d0DIqrwuFXwHcQ5-A~z3O8UjrYrAiBLj7luv-J9PaebFB1h81KxU2B7mR-64E5quEhVw3Dw0xAqpuD4mfhLNOe-kM6IWbSsyRh3TlrY16M0BOrsIXUWtavPN7r0nX5VgzHwI~m-gYMhwf7vvy8xjTRDXET0WeVTaZy7kOqmmXwUFVIs8Y77zU5ksvwoXWOxJqsqWLSjdTIxfBXBFdYcuhcv0NLEHhW8HpMQ7GB4KtU45uDtJKQXjZh6LeYIkbenDbJ6n2dxYwVoVnfSFfIx5AlmjV4My8AgGpkY6x7WKv~JO3ObHKGPYbh3VWISyh~eE0XhoPSnWR2k7842i7pAvgA&Key-Pair-Id=K2D8SOWYIPDBRT";
const soccer =
  "https://files.instantdb.com/fd13e78a-1a89-44ed-b1f3-3500218ed3f0/7/16ed7a06-4eed-49f5-bc35-7a9826850660?response-cache-control=public%2C%20max-age%3D86400%2C%20immutable&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9maWxlcy5pbnN0YW50ZGIuY29tL2ZkMTNlNzhhLTFhODktNDRlZC1iMWYzLTM1MDAyMThlZDNmMC83LzE2ZWQ3YTA2LTRlZWQtNDlmNS1iYzM1LTdhOTgyNjg1MDY2MD9yZXNwb25zZS1jYWNoZS1jb250cm9sPXB1YmxpYyUyQyUyMG1heC1hZ2UlM0Q4NjQwMCUyQyUyMGltbXV0YWJsZSIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc4NDE2MDAwMH19fV19&Signature=nWj8dYnToffPi0OXdWyCIUPFgZjNIl5yWeemcTwy0Zj-N3Hj4ucISSfl73p7wqQKUk9efbKluVtea0BMSH614S2-AKWc-1MR1z65jZVrnFJfBXeodGVhZHoI06eDbj6LSEjp4WM22fWNL5yMUmsDr4sEFJSnYZmp-MehQ5ft1OurQGHOGNzjiLvzaCFqvPAys3I72BbuuGxUt0HfvzBcA9-VDJ4rsA~s9-qSPa8nBT5XFO~YbFoUqGs6v3dY6dZJrzlWOWLNR1-WNZHMfIcF7PsTpm9SHwtfv9J4UsDxsIiu0r4XvrCSfBlJvxaFhuDYOlm6V8JLUwEgt6YCW~X78g&Key-Pair-Id=K2D8SOWYIPDBRT";

/**
 * Static, sport-scoped translation keys. Sessions and metrics translate via
 * `demo.<sport>.<name>` in `dictionaries.ts`; only fixed values (price
 * numerals, image URLs) stay outside the dictionary.
 */
type SportSetup = {
  id: "swimming" | "gymnastics" | "soccer";
  image: string;
  price: string;
  sessionKeys: readonly string[];
  metricKeys: readonly { key: string; value: string }[];
};

const setups: Record<string, SportSetup> = {
  swimming: {
    id: "swimming",
    image: swimming,
    price: "$180 / month",
    sessionKeys: ["squad", "learnToSwim", "masters", "strokeClinic"],
    metricKeys: [
      { key: "activeSwimmers", value: "312" },
      { key: "weeklySessions", value: "48" },
      { key: "laneUtilization", value: "86%" },
    ],
  },
  gymnastics: {
    id: "gymnastics",
    image: gymnastics,
    price: "$540 / term",
    sessionKeys: ["recreational", "competitive", "tumbling", "parentTot"],
    metricKeys: [
      { key: "activeGymnasts", value: "268" },
      { key: "apparatusRotations", value: "36" },
      { key: "coachRatio", value: "1:6" },
    ],
  },
  soccer: {
    id: "soccer",
    image: soccer,
    price: "$120 / month",
    sessionKeys: ["skillsAcademy", "matchPrep", "u12", "goalkeeping"],
    metricKeys: [
      { key: "registeredPlayers", value: "540" },
      { key: "teamsManaged", value: "24" },
      { key: "attendanceRate", value: "94%" },
    ],
  },
};

const order = ["swimming", "gymnastics", "soccer"] as const;

export function Demo() {
  const [sport, setSport] = useState<SportSetup["id"]>("swimming");
  const reduceMotion = useReducedMotion();
  const { t } = useI18n();
  const setup = setups[sport]!;
  const sportLabel = t(`sport.${sport}`);

  return (
    <section className="border-t border-border bg-surface-secondary" id="demo">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-6 lg:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <p className="inline-block rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-accent-foreground">
            {t("demo.eyebrow")}
          </p>
          <h2 className="font-display mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            {t("demo.title")}
          </h2>
          <p className="mt-4 text-lg text-muted">{t("demo.subtitle")}</p>
        </div>

        <div className="mt-10 flex justify-center">
          <Segment
            selectedKey={sport}
            onSelectionChange={(key) => setSport(String(key) as SportSetup["id"])}
          >
            {order.map((id) => (
              <Segment.Item key={id} id={id}>
                {t(`sport.${id}`)}
              </Segment.Item>
            ))}
          </Segment>
        </div>

        <div className="mt-10 grid overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_24px_60px_-40px_rgba(15,23,42,0.4)] lg:grid-cols-2">
          <div className="relative min-h-[320px] overflow-hidden lg:min-h-[460px]">
            <AnimatePresence mode="wait">
              <motion.img
                key={setup.id}
                alt={sportLabel}
                className="absolute inset-0 size-full object-cover"
                src={setup.image}
                {...(reduceMotion
                  ? {}
                  : {
                      initial: { opacity: 0, scale: 1.04 },
                      animate: { opacity: 1, scale: 1 },
                      exit: { opacity: 0 },
                      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
                    })}
              />
            </AnimatePresence>
            <div className="absolute bottom-4 left-4">
              <Chip color="accent" size="sm" variant="soft">
                <Iconify className="size-3" icon="circle-check-fill" />
                {t("demo.liveSetup", { sport: sportLabel })}
              </Chip>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={setup.id}
                {...(reduceMotion
                  ? {}
                  : {
                      initial: { opacity: 0, y: 12 },
                      animate: { opacity: 1, y: 0 },
                      exit: { opacity: 0, y: -12 },
                      transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const },
                    })}
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-surface-secondary text-foreground">
                    <Iconify className="size-5" icon="house" />
                  </div>
                  <div>
                    <p className="font-display text-base font-semibold text-foreground">
                      {t(`demo.${sport}.venue`)}
                    </p>
                    <p className="text-sm text-muted">{t(`demo.${sport}.venueDetail`)}</p>
                  </div>
                </div>

                <div className="mt-6">
                  <p className="text-xs font-medium tracking-wide text-muted uppercase">
                    {t("demo.sessionTypes")}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {setup.sessionKeys.map((sessionKey) => (
                      <Chip key={sessionKey} size="sm" variant="secondary">
                        {t(`demo.${sport}.session.${sessionKey}`)}
                      </Chip>
                    ))}
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-3 border-t border-border pt-6">
                  {setup.metricKeys.map((metric) => (
                    <div key={metric.key}>
                      <p className="font-display text-2xl font-bold text-foreground tabular-nums">
                        {metric.value}
                      </p>
                      <p className="mt-1 text-xs leading-tight text-muted">
                        {t(`demo.${sport}.metric.${metric.key}`)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex items-center justify-between rounded-xl border border-border p-4">
                  <div className="flex items-center gap-3">
                    <Iconify
                      className="size-9 rounded-lg bg-accent p-2 text-accent-foreground"
                      icon="credit-card"
                    />
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {t(`demo.${sport}.planLabel`)}
                      </p>
                      <p className="text-xs text-muted">{t("demo.planNote")}</p>
                    </div>
                  </div>
                  <p className="font-display text-lg font-bold text-foreground">{setup.price}</p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
