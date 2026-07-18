import { CtaBand } from "../components/landing/cta-band";
import { Demo } from "../components/landing/demo";
import { Faq } from "../components/landing/faq";
import { Features } from "../components/landing/features";
import { Hero } from "../components/landing/hero";
import { Proof } from "../components/landing/proof";
import { Seo, softwareJsonLd } from "../components/seo";

export function IndexRoute() {
  return (
    <>
      <Seo jsonLd={softwareJsonLd} path="/" />
      <Hero />
      <Features />
      <Demo />
      <Proof />
      <Faq />
      <CtaBand />
    </>
  );
}
