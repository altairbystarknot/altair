import type { Metadata } from "next";
import { pickText } from "@altair/config";
import { getPublicConfig } from "@/lib/config/business-config";
import { siteFaq } from "@/lib/public/faq";
import { getLocale } from "@/lib/public/locale";
import { STOCK } from "../_site/nav";
import { BookNowButton, GlassButton } from "../_site/ui/Glass";
import { PageHero, PageTitle } from "../_site/ui/PageHero";
import { TornSection } from "../_site/ui/Torn";

export const metadata: Metadata = { title: "Preguntas frecuentes" };

// Frequent questions: the owner's own (site.faq), or answers built from the business's real settings.
export default async function FaqPage() {
  const { config, site, paymentInstructions } = await getPublicConfig();
  if (!config) return null;
  const locale = await getLocale();
  const en = locale === "en";
  const faq = siteFaq(config, site, locale, pickText(paymentInstructions, locale, ""));
  return (
    <main>
      <PageHero image={{ src: STOCK.sunset, width: 2400, height: 1600 }} alt="" wave={{ shape: "drift", seed: "faq-hero" }} />
      <TornSection id="preguntas" tone="shell" aria-labelledby="preguntas-title">
        <PageTitle id="preguntas-title" title={en ? "Questions" : "Preguntas"} eyebrow={config.name} caps={en ? "Before you book" : "Antes de reservar"} />
        <div className="site-faq site-faq--light">
          {faq.map((f, i) => (
            <details key={i} className="site-faq__item" open={i === 0}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
        <div className="lg-cluster lg-cluster--center site-actions">
          <BookNowButton href="/reservar" label={en ? "Book now" : "Reservar"} tone="ocean" />
          <GlassButton tone="white" shape="soft" href="/contacto">{en ? "Ask us" : "Escríbanos"}</GlassButton>
        </div>
      </TornSection>
    </main>
  );
}
