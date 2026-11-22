import { Icon } from "@altair/ui";
import { dict, type Locale } from "../_i18n/copy";
import { Rich } from "./rich";

// Two example conversations between an owner and their Claude, typeset in HTML (no images, no mock
// graphics). Both are labelled as examples with fictional data, and both use only real Altair tools.

function Head({ locale }: { locale: Locale }) {
  const t = dict(locale).convo;
  return (
    <div className="h-convo-head">
      <span className="h-convo-app">
        <b>{t.app}</b>
        <span><i aria-hidden="true" /> {t.connected}</span>
      </span>
      <span className="h-tag">{t.tag}</span>
    </div>
  );
}

function ToolCall({ name }: { name: string }) {
  return (
    <p className="h-toolcall">
      <Icon name="check" size={13} strokeWidth={2.6} />
      <span>{name}</span>
    </p>
  );
}

/** "How many services do I have tomorrow?" answered from the business's own data. */
export function ConvoBookings({ locale, className }: { locale: Locale; className?: string }) {
  const t = dict(locale).convo;
  const b = t.bookings;
  return (
    <figure className={`h-convo${className ? ` ${className}` : ""}`}>
      <Head locale={locale} />
      <div className="h-convo-body">
        <div className="h-msg-me">
          <span className="sr-only">{t.you}: </span>
          {b.ask}
        </div>
        <div className="h-msg-ai">
          <span className="sr-only">{t.app}: </span>
          <ToolCall name={b.tool} />
          <p><Rich t={b.intro} /></p>
          <table className="h-mini">
            <thead>
              <tr>{b.cols.map((c) => <th key={c} scope="col">{c}</th>)}</tr>
            </thead>
            <tbody>
              {b.rows.map((r) => (
                <tr key={r.time}>
                  <td>{r.time}</td>
                  <td>{r.what}</td>
                  <td><span className={`h-state${r.warn ? " warn" : ""}`}>{r.state}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          <p>{b.close}</p>
        </div>
      </div>
      <figcaption className="h-convo-note">{t.note}</figcaption>
    </figure>
  );
}

/** A price change requested in plain words, prepared as a draft that a person publishes. */
export function ConvoDraft({ locale, className }: { locale: Locale; className?: string }) {
  const t = dict(locale).convo;
  const d = t.draft;
  return (
    <figure className={`h-convo${className ? ` ${className}` : ""}`}>
      <Head locale={locale} />
      <div className="h-convo-body">
        <div className="h-msg-me">
          <span className="sr-only">{t.you}: </span>
          {d.ask}
        </div>
        <div className="h-msg-ai">
          <span className="sr-only">{t.app}: </span>
          <div className="h-toolcalls">{d.tools.map((x) => <ToolCall key={x} name={x} />)}</div>
          <p><Rich t={d.intro} /></p>
          <div className="h-draft">
            <div className="h-draft-top">
              <span className="h-state warn">{d.card.state}</span>
            </div>
            <b className="h-draft-title">{d.card.title}</b>
            <ul>
              {d.card.rows.map((r) => (
                <li key={r.what}><span>{r.what}</span><b>{r.price}</b></li>
              ))}
            </ul>
            <span className="h-draft-action">{d.card.action} <Icon name="arrowRight" size={15} /></span>
          </div>
        </div>
      </div>
      <figcaption className="h-convo-note">{t.note}</figcaption>
    </figure>
  );
}
