import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@altair/ui";
import { Closing } from "../../../_components/closing";
import { ConvoBookings, ConvoDraft } from "../../../_components/convo";
import { Rich } from "../../../_components/rich";
import { dict, href, isLocale } from "../../../_i18n/copy";

// What the owner's own Claude can do through the Altair connector. The tools and permissions listed here
// mirror the real ones (apps/web/lib/mcp/tools.ts and apps/web/lib/mcp/oauth.ts): keep them in step.

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale } = await params;
  return isLocale(locale) ? dict(locale).meta.pages.claude : {};
}

export default async function ClaudePage({ params }: Params) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = dict(locale);
  const c = t.claude;
  const [open, close] = locale === "es" ? ["«", "»"] : ["“", "”"];
  return (
    <>
      <section className="h-hero compact has-duo" aria-labelledby="claude-title">
        <div className="h-wrap h-duo hero">
          <div>
            <p className="h-kicker h-rise">{c.hero.kicker}</p>
            <h1 id="claude-title" className="h-display md h-rise" style={{ animationDelay: "60ms" }}>
              <Rich t={c.hero.title} />
            </h1>
            <p className="h-lede h-rise" style={{ animationDelay: "120ms" }}>{c.hero.lede}</p>
            <div className="h-actions h-rise" style={{ animationDelay: "160ms" }}>
              <Link className="btn tint lg" href={href(locale, "request")}>
                {t.common.request} <Icon name="arrowRight" size={18} />
              </Link>
              <a className="h-arrow" href="#herramientas">
                {c.tools.kicker} <Icon name="arrowRight" size={16} />
              </a>
            </div>
          </div>
          <ConvoBookings locale={locale} className="h-rise" />
        </div>
      </section>

      <section className="h-sec" aria-labelledby="claude-what">
        <div className="h-wrap h-split">
          <div>
            <p className="h-kicker">{c.what.kicker}</p>
            <h2 id="claude-what" className="h-h2"><Rich t={c.what.title} /></h2>
          </div>
          <div>
            <div className="h-prose">
              {c.what.paragraphs.map((p) => <p key={p}>{p}</p>)}
            </div>
            <ul className="h-facts">
              {c.what.facts.map((f) => (
                <li key={f.t}>
                  <h3 className="h-h3">{f.t}</h3>
                  <p>{f.d}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="h-sec sand" aria-labelledby="claude-connect">
        <div className="h-wrap">
          <div className="h-headrow">
            <div>
              <p className="h-kicker">{c.connect.kicker}</p>
              <h2 id="claude-connect" className="h-h2"><Rich t={c.connect.title} /></h2>
            </div>
          </div>
          <ol className="h-steps3">
            {c.connect.steps.map((s, i) => (
              <li key={s.t}>
                <span className="h-num">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="h-h3">{s.t}</h3>
                <p>{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="h-sec" aria-labelledby="claude-scopes">
        <div className="h-wrap h-split">
          <div>
            <p className="h-kicker">{c.scopes.kicker}</p>
            <h2 id="claude-scopes" className="h-h2"><Rich t={c.scopes.title} /></h2>
            <p className="h-lede">{c.scopes.text}</p>
          </div>
          <ul className="h-defs">
            {c.scopes.items.map((s) => (
              <li key={s.t}>
                <b>{s.t}</b>
                <span>{s.d}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="herramientas" className="h-sec sand h-anchor" aria-labelledby="claude-tools">
        <div className="h-wrap">
          <div className="h-headrow">
            <div>
              <p className="h-kicker">{c.tools.kicker}</p>
              <h2 id="claude-tools" className="h-h2"><Rich t={c.tools.title} /></h2>
            </div>
            <p className="h-lede">{c.tools.text}</p>
          </div>
          <div className="h-tools">
            <div className="h-tools-cols" aria-hidden="true">
              <span>{c.tools.cols.ask}</span>
              <span>{c.tools.cols.does}</span>
              <span />
            </div>
            {c.tools.groups.map((g) => (
              <section key={g.title} className="h-tools-group" aria-label={g.title}>
                <h3 className="h-tools-title">{g.title}</h3>
                <ul>
                  {g.items.map((x) => (
                    <li key={x.tool} className="h-tool">
                      <p className="h-tool-ask">{open}{x.ask}{close}</p>
                      <p className="h-tool-does">{x.does}</p>
                      <code className="h-tool-name">{x.tool}</code>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
      </section>

      <section className="h-sec" aria-labelledby="claude-draft">
        <div className="h-wrap h-duo">
          <div>
            <p className="h-kicker">{c.draft.kicker}</p>
            <h2 id="claude-draft" className="h-h2"><Rich t={c.draft.title} /></h2>
            <p className="h-lede">{c.draft.text}</p>
          </div>
          <ConvoDraft locale={locale} />
        </div>
      </section>

      <section className="h-sec ink" aria-labelledby="claude-limits">
        <div className="h-wrap">
          <div className="h-headrow">
            <div>
              <p className="h-kicker">{c.limits.kicker}</p>
              <h2 id="claude-limits" className="h-h2"><Rich t={c.limits.title} /></h2>
            </div>
          </div>
          <div className="h-limits">
            <ul className="h-ruled never">
              {c.limits.never.map((x) => <li key={x}>{x}</li>)}
            </ul>
            <div>
              <h3 className="h-h3">{c.limits.promiseTitle}</h3>
              <ul className="h-ruled yes">
                {c.limits.promise.map((x) => <li key={x}>{x}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <Closing locale={locale} />
    </>
  );
}
