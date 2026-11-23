import { Icon } from "@altair/ui";
import { dict, type Locale } from "../_i18n/copy";

/** Altair Lite: the free, open demo anyone can connect to their own Claude. */
export const LITE_URL = "https://altair-lite.vercel.app";

/**
 * The free demo, offered beside every request button: a white pill with a live dot, the action and a short
 * caption. `compact` is the one-line version for the navigation bar.
 */
export function DemoButton({ locale, compact = false, className = "" }: { locale: Locale; compact?: boolean; className?: string }) {
  const d = dict(locale).demo;
  if (compact) {
    return (
      <a className={`h-demopill ${className}`} href={LITE_URL} target="_blank" rel="noopener noreferrer" aria-label={d.label}>
        <span className="h-demodot" aria-hidden="true" />
        <span className="h-demopill-long">{d.nav}</span>
        <span className="h-demopill-short" aria-hidden="true">{d.navShort}</span>
      </a>
    );
  }
  return (
    <a className={`h-demobtn ${className}`} href={LITE_URL} target="_blank" rel="noopener noreferrer" aria-label={d.label}>
      <span className="h-demodot" aria-hidden="true" />
      <span className="h-demobtn-txt">
        <b>{d.cta}</b>
        <small>{d.caption}</small>
      </span>
      <Icon name="arrowRight" size={16} />
    </a>
  );
}
