import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@altair/ui";
import { ConvoBookings } from "../../_components/convo";
import { Closing } from "../../_components/closing";
import { Film } from "../../_components/film";
import { Layered } from "../../_components/layered";
import { Hero3D } from "../../_components/fx/hero-3d";
import { ScrollStory } from "../../_components/fx/scroll-story";
import { SpatialCarousel, type SpatialItem } from "../../_components/fx/spatial-carousel";
import { OriginStory } from "../../_components/origin";
import { Rich } from "../../_components/rich";
import { Shot } from "../../_components/shot";
import { Star } from "../../_components/star";
import { dict, href, isLocale } from "../../_i18n/copy";

// Altair's home, light and spatial: the glass star in 3D, what is included in four cards, the real product on
// a curved arc, the panel, the owner's Claude, the film, how to start told by scrolling (with a small piece of
// interface per step), where Altair comes from (two real screens in depth), and the request.

const INCLUDE_ICONS = ["globe", "route", "clipboard", "message"] as const;

const SHOTS = ["site-home", "transfer", "activity", "cart", "panel-bookings", "panel-catalog"] as const;
const SHOT_KEYS = ["siteHome", "transfer", "activity", "cart", "panelBookings", "panelCatalog"] as const;

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = dict(locale);
  const h = t.home;
  const v = t.vision;
  const items: SpatialItem[] = SHOTS.map((s, i) => ({
    src: `/media/shots/${s}.jpg`,
    alt: t.shots[SHOT_KEYS[i]!].alt,
    url: t.shots[SHOT_KEYS[i]!].url,
    title: v.carousel.items[i]!.title,
    caption: v.carousel.items[i]!.caption,
  }));

  return (
    <>
      <section className="h-hero3" aria-labelledby="home-title">
        <Hero3D />
        <div className="h-wrap wide">
          <div className="h-hero3-copy">
            <p className="h-chip" data-reveal><i><Star size={12} /></i>{h.hero.kicker}</p>
            <h1 id="home-title" className="h-display" data-reveal style={{ ["--d" as string]: "80ms" }}>
              <Rich t={h.hero.title} />
            </h1>
            <p className="h-lede" data-reveal style={{ ["--d" as string]: "160ms" }}>{h.hero.lede}</p>
            <div className="h-actions" data-reveal style={{ ["--d" as string]: "240ms" }}>
              <Link className="btn tint lg" href={href(locale, "request")}>
                {t.common.request} <Icon name="arrowRight" size={18} />
              </Link>
              <Link className="h-glassbtn" href={href(locale, "how")}>
                {t.common.how}
              </Link>
            </div>
          </div>
        </div>
        <nav className="h-dock" aria-label={t.nav.main}>
          <a href="#producto"><span>01</span><b>{v.dock.product}</b></a>
          <a href="#claude"><span>02</span><b>{v.dock.claude}</b></a>
          <a href="#empezar"><span>03</span><b>{v.dock.start}</b></a>
        </nav>
      </section>

      <section className="h-sec" aria-labelledby="home-includes">
        <div className="h-wrap wide">
          <div className="h-headrow">
            <div data-reveal>
              <p className="h-kicker">{h.includes.kicker}</p>
              <h2 id="home-includes" className="h-h2"><Rich t={h.includes.title} /></h2>
            </div>
            <p className="h-lede" data-reveal style={{ ["--d" as string]: "100ms" }}>{h.includes.lede}</p>
          </div>
          <ol className="h-prism">
            {h.includes.items.map((it, i) => (
              <li key={it.t} className="h-prism-pane" data-reveal style={{ ["--d" as string]: `${i * 70}ms` }}>
                <div className="h-prism-top">
                  <span className="h-prism-ico" aria-hidden="true"><Icon name={INCLUDE_ICONS[i] ?? "sparkle"} size={20} /></span>
                  <span className="h-num">{String(i + 1).padStart(2, "0")}</span>
                </div>
                <div>
                  <h3 className="h-h3">{it.t}</h3>
                  <p>{it.d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="producto" className="h-sec h-anchor" aria-labelledby="home-site">
        <div className="h-wrap">
          <div className="h-center h-sechead" data-reveal>
            <p className="h-kicker center">{h.site.kicker}</p>
            <h2 id="home-site" className="h-h2"><Rich t={h.site.title} /></h2>
            <p className="h-lede">{h.site.text}</p>
          </div>
        </div>
        <div data-reveal>
          <SpatialCarousel items={items} labels={v.carousel} />
        </div>
      </section>

      <section className="h-sec" aria-labelledby="home-panel">
        <div className="h-wrap h-duo">
          <div data-reveal>
            <p className="h-kicker">{h.panel.kicker}</p>
            <h2 id="home-panel" className="h-h2"><Rich t={h.panel.title} /></h2>
            <p className="h-lede">{h.panel.text}</p>
            <ul className="h-ticks">
              {h.panel.points.map((p) => <li key={p}>{p}</li>)}
            </ul>
          </div>
          <div data-reveal style={{ ["--d" as string]: "120ms" }}>
            <Shot
              src="/media/shots/panel-home.jpg"
              alt={t.shots.panelBookings.alt}
              url={t.shots.panelBookings.url.replace("/reservas", "")}
              caption={t.shots.panelBookings.caption}
              note={t.common.sampleNote}
              sizes="(max-width: 900px) 100vw, 680px"
            />
          </div>
        </div>
      </section>

      <section id="claude" className="h-sec h-anchor" aria-labelledby="home-claude">
        <div className="h-wrap h-duo">
          <div data-reveal>
            <p className="h-kicker">{h.claude.kicker}</p>
            <h2 id="home-claude" className="h-h2"><Rich t={h.claude.title} /></h2>
            <p className="h-lede">{h.claude.text}</p>
            <ul className="h-ticks">
              {h.claude.points.map((p) => <li key={p}>{p}</li>)}
            </ul>
            <div className="h-actions">
              <Link className="h-glassbtn" href={href(locale, "claude")}>
                {h.claude.link} <Icon name="arrowRight" size={16} />
              </Link>
            </div>
          </div>
          <div data-reveal style={{ ["--d" as string]: "120ms" }}>
            <ConvoBookings locale={locale} />
          </div>
        </div>
      </section>

      <section className="h-sec" aria-labelledby="home-film">
        <div className="h-wrap">
          <div className="h-center h-sechead" data-reveal>
            <p className="h-kicker center">{h.film.kicker}</p>
            <h2 id="home-film" className="h-h2"><Rich t={h.film.title} /></h2>
          </div>
          <div data-reveal>
            <Film play={t.film.play} length={t.film.length} label={t.film.label} note={t.film.note} />
          </div>
        </div>
      </section>

      <section id="empezar" className="h-anchor" aria-labelledby="home-steps">
        <h2 id="home-steps" className="sr-only">{h.steps.kicker}</h2>
        <ScrollStory kicker={h.steps.kicker} title={<Rich t={h.steps.title} />} steps={h.steps.items} stepLabel={v.step} vignettes={v.vignettes} />
      </section>

      <section className="h-sec" aria-labelledby="home-story">
        <div className="h-wrap h-storyrow">
          <div data-reveal>
            <Layered
              back={{ src: "/media/shots/transfer.jpg", url: t.shots.transfer.url, alt: t.shots.transfer.alt }}
              front={{ src: "/media/shots/panel-home.jpg", url: t.shots.panelBookings.url.replace("/reservas", ""), alt: t.shots.panelBookings.alt }}
              note={t.common.sampleNote}
            />
          </div>
          <div data-reveal style={{ ["--d" as string]: "120ms" }}>
            <p className="h-kicker">{t.story.kicker}</p>
            <h2 className="h-h2"><Rich t={t.story.title} /></h2>
            <OriginStory locale={locale} className="h-origin sm" />
            <Link className="h-glassbtn" href={href(locale, "story")}>
              {t.story.more} <Icon name="arrowRight" size={16} />
            </Link>
          </div>
        </div>
      </section>

      <Closing locale={locale} />
    </>
  );
}
