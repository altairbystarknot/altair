import type { Locale } from "../_i18n/copy";

// THE ORIGIN STORY. This paragraph is the ONE place where the project Altair comes from is named (an
// exception approved by the owner on 2026-11-21, see CLAUDE.md §2.4). Nothing else on the site, in either
// language, names it. Keep it to this single paragraph.

const ORIGIN: Record<Locale, string> = {
  es:
    "Altair es una iniciativa experimental de Starknot, impulsada por Claude, para simplificar el trabajo de los dueños de negocios de turismo. Está inspirada en la lógica de Green Road, una plataforma de gran escala, y respaldada por las personas que la construyeron y por la base de conocimiento que ese proyecto dejó: cómo se cotiza un traslado, cómo se organiza un día de operación y qué necesita realmente un operador. Pero Altair no es Green Road: es una versión experimental y mucho más acotada, sin el tamaño ni la escalabilidad de esa plataforma. Su experiencia de uso, su diseño, las funciones de su panel y sus motores no son los de Green Road, que es un producto pulido y en producción: Altair se construyó en los tres días de la hackathon, lo mejor posible, para mostrar la idea. Quien necesite algo de esa escala lo construye con Starknot, a medida.",
  en:
    "Altair is an experimental Starknot initiative, powered by Claude, to make work easier for tourism business owners. It is inspired by the logic of Green Road, a large-scale platform, and backed by the people who built it and by the knowledge base that project left behind: how a transfer is quoted, how a day of operations is organized and what an operator really needs. But Altair is not Green Road: it is an experimental and far narrower version, without that platform's size or scalability. Its user experience, its design, its panel's features and its engines are not Green Road's, which is a polished product in production: Altair was built in the three days of the hackathon, as well as possible, to show the idea. Anyone who needs something at that scale builds it with Starknot, custom-made.",
};

export function OriginStory({ locale, className }: { locale: Locale; className?: string }) {
  return <p className={className ?? "h-origin"}>{ORIGIN[locale]}</p>;
}
