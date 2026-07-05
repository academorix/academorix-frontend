/**
 * @file testimonials-section.tsx
 * @module components/landing/testimonials-section
 *
 * @description
 * Three customer testimonials, each a semantic `<figure>` with a
 * `<blockquote>` and an attributed `<figcaption>`. Author avatars use initials
 * fallbacks (no remote image dependency), so the section renders crisply
 * offline and in both themes.
 */

import { Avatar, Card } from "@academorix/ui/react";

import type { ReactNode } from "react";

import { SectionHeading } from "@/components/landing/section-heading";

/** A single customer testimonial. */
interface Testimonial {
  quote: string;
  name: string;
  role: string;
  initials: string;
}

/** The testimonials, in display order. */
const TESTIMONIALS: readonly Testimonial[] = [
  {
    quote:
      "Academorix replaced three tools and a stack of spreadsheets. Our coaches finally spend their time coaching.",
    name: "Layla Haddad",
    role: "Director, AquaElite Swim",
    initials: "LH",
  },
  {
    quote:
      "Attendance and performance in one place changed how we run tryouts. Setup took a single afternoon.",
    name: "Marcus Bell",
    role: "Head Coach, Summit Hoops",
    initials: "MB",
  },
  {
    quote:
      "Multi-branch billing used to be a nightmare. Now renewals just work — in Arabic and English.",
    name: "Sara Nassar",
    role: "Operations Lead, Northgate FC",
    initials: "SN",
  },
] as const;

/** The testimonials section. */
export function TestimonialsSection(): ReactNode {
  return (
    <section aria-labelledby="testimonials-heading" className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Testimonials"
          headingId="testimonials-heading"
          title="Loved by academy teams"
        />

        <ul className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {TESTIMONIALS.map((testimonial) => (
            <li key={testimonial.name}>
              <Card className="h-full">
                <Card.Content className="py-6">
                  <figure className="flex h-full flex-col gap-6">
                    <blockquote className="flex-1 text-pretty text-foreground">
                      &ldquo;{testimonial.quote}&rdquo;
                    </blockquote>
                    <figcaption className="flex items-center gap-3">
                      <Avatar color="accent">
                        <Avatar.Fallback>{testimonial.initials}</Avatar.Fallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-foreground">
                          {testimonial.name}
                        </span>
                        <span className="text-xs text-muted">{testimonial.role}</span>
                      </div>
                    </figcaption>
                  </figure>
                </Card.Content>
              </Card>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
