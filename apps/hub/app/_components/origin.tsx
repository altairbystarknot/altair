import type { Locale } from "../_i18n/copy";

// THE ORIGIN STORY. This paragraph is the ONE place where the project Altair comes from is named (an
// exception approved by the owner on 2026-11-21, see CLAUDE.md §2.4). Nothing else on the site, in either
// language, names it. Keep it to this single paragraph.

const ORIGIN: Record<Locale, string> = {
  es:
    "Altair es una iniciativa de Starknot, impulsada por Claude, para simplificar el trabajo de los dueños de negocios de turismo. Está inspirada y respaldada por Green Road, un proyecto de gran escala, y por la base de conocimiento que este dejó: cómo se cotiza un traslado, cómo se organiza un día de operación y qué necesita realmente un operador. Por eso Starknot construye Altair: para llevar todo ese conocimiento a nuevos dueños de negocio del sector turístico.",
  en:
    "Altair is a Starknot initiative, powered by Claude, to make work easier for tourism business owners. It is inspired and backed by Green Road, a large-scale project, and by the knowledge base it left behind: how a transfer is quoted, how a day of operations is organized and what an operator really needs. That is why Starknot is building Altair: to bring all of that knowledge to new business owners in the tourism sector.",
};

export function OriginStory({ locale, className }: { locale: Locale; className?: string }) {
  return <p className={className ?? "h-origin"}>{ORIGIN[locale]}</p>;
}
