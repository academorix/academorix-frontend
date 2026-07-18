import { useEffect } from "react";

import { brand } from "../brand";
import { useI18n } from "../i18n";

export const SITE_URL = "https://academorix.com";

type SeoProps = {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  type?: "website" | "article";
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
};

function upsertMeta(selector: string, attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);

  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }

  el.setAttribute("content", content);
}

function upsertLink(rel: string, href: string, hreflang?: string) {
  const selector = hreflang
    ? `link[rel="${rel}"][hreflang="${hreflang}"]`
    : `link[rel="${rel}"]:not([hreflang])`;
  let el = document.head.querySelector<HTMLLinkElement>(selector);

  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    if (hreflang) el.setAttribute("hreflang", hreflang);
    document.head.appendChild(el);
  }

  el.setAttribute("href", href);
}

function setJsonLd(data: SeoProps["jsonLd"]) {
  const id = "seo-jsonld";
  const existing = document.getElementById(id);

  if (existing) existing.remove();
  if (!data) return;

  const script = document.createElement("script");

  script.id = id;
  script.type = "application/ld+json";
  script.text = JSON.stringify(data);
  document.head.appendChild(script);
}

export function Seo({
  title,
  description,
  path = "/",
  image = "/og-cover.png",
  type = "website",
  noindex = false,
  jsonLd,
}: SeoProps) {
  const { locale } = useI18n();

  const fullTitle = title ? `${title} — ${brand.name}` : `${brand.name} — ${brand.tagline}`;
  const desc = description ?? (brand as { description?: string }).description ?? "";
  const url = SITE_URL + path;
  const absImage = image.startsWith("http") ? image : SITE_URL + image;

  useEffect(() => {
    document.title = fullTitle;

    upsertMeta('meta[name="description"]', "name", "description", desc);
    upsertMeta(
      'meta[name="robots"]',
      "name",
      "robots",
      noindex ? "noindex,nofollow" : "index,follow",
    );

    upsertMeta('meta[property="og:title"]', "property", "og:title", fullTitle);
    upsertMeta('meta[property="og:description"]', "property", "og:description", desc);
    upsertMeta('meta[property="og:type"]', "property", "og:type", type);
    upsertMeta('meta[property="og:url"]', "property", "og:url", url);
    upsertMeta('meta[property="og:image"]', "property", "og:image", absImage);
    upsertMeta('meta[property="og:site_name"]', "property", "og:site_name", brand.name);
    upsertMeta(
      'meta[property="og:locale"]',
      "property",
      "og:locale",
      locale === "ar" ? "ar_AR" : "en_US",
    );

    upsertMeta('meta[name="twitter:card"]', "name", "twitter:card", "summary_large_image");
    upsertMeta('meta[name="twitter:title"]', "name", "twitter:title", fullTitle);
    upsertMeta('meta[name="twitter:description"]', "name", "twitter:description", desc);
    upsertMeta('meta[name="twitter:image"]', "name", "twitter:image", absImage);

    upsertLink("canonical", url);
    upsertLink("alternate", url + "?lang=en", "en");
    upsertLink("alternate", url + "?lang=ar", "ar");
    upsertLink("alternate", url, "x-default");

    setJsonLd(jsonLd);
  }, [fullTitle, desc, url, absImage, type, noindex, locale, jsonLd]);

  return null;
}

export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Academorix",
  url: SITE_URL,
  description:
    "Sport-agnostic academy management for scheduling, parent communication, and automated billing.",
  sameAs: [
    "https://x.com/academorix",
    "https://www.linkedin.com/company/academorix",
    "https://www.youtube.com/@academorix",
  ],
};

export const softwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Academorix",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD", description: "14-day free trial" },
  aggregateRating: { "@type": "AggregateRating", ratingValue: "4.8", ratingCount: "412" },
};
