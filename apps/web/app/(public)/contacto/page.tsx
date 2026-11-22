import type { Metadata } from "next";
import { getPublicConfig } from "@/lib/config/business-config";
import { getLocale } from "@/lib/public/locale";
import { STOCK } from "../_site/nav";
import { GlassButton } from "../_site/ui/Glass";
import { MailIcon, WhatsAppIcon } from "../_site/ui/icons";
import { PageHero, PageTitle } from "../_site/ui/PageHero";
import { TornSection } from "../_site/ui/Torn";
import { Lead } from "../_site/ui/Typography";

export const metadata: Metadata = { title: "Contacto" };

// Contact: the channels the business configured (WhatsApp, email). A person answers.
export default async function ContactPage() {
  const { config } = await getPublicConfig();
  if (!config) return null;
  const locale = await getLocale();
  const en = locale === "en";
  const digits = (config.contactWhatsapp ?? "").replace(/\D/g, "");
  const wa = digits.length >= 7 ? `https://wa.me/${digits}?text=${encodeURIComponent(en ? `Hi ${config.name}!` : `¡Hola ${config.name}!`)}` : null;
  return (
    <main>
      <PageHero image={{ src: STOCK.airport, width: 2400, height: 1600 }} alt="" wave={{ shape: "drift", seed: "contact-hero" }} />
      <TornSection id="contacto" tone="shell" aria-labelledby="contacto-title">
        <PageTitle id="contacto-title" title={en ? "Contact" : "Contacto"} eyebrow={config.name} />
        <Lead className="site-contact-lead">{en ? "A special route, a large group or a question before booking? Write to us and a person answers." : "¿Una ruta especial, un grupo grande o una pregunta antes de reservar? Escríbanos y le responde una persona."}</Lead>
        <div className="site-contact-cards">
          {wa && (
            <a className="site-contact-card" href={wa} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon />
              <span><small>WhatsApp</small><strong>{config.contactWhatsapp}</strong></span>
            </a>
          )}
          {config.contactEmail && (
            <a className="site-contact-card" href={`mailto:${config.contactEmail}`}>
              <MailIcon />
              <span><small>{en ? "Email" : "Correo"}</small><strong>{config.contactEmail}</strong></span>
            </a>
          )}
        </div>
        <div className="lg-cluster lg-cluster--center site-actions">
          <GlassButton tone="ocean" href="/reservar">{en ? "Book now" : "Reservar"}</GlassButton>
          {wa && <GlassButton tone="white" shape="soft" href={wa} target="_blank" rel="noopener noreferrer" icon={<WhatsAppIcon />} iconPosition="start">WhatsApp</GlassButton>}
        </div>
      </TornSection>
    </main>
  );
}
