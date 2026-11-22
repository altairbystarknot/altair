"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import { AI } from "./_ui/icons";

// The catalogue: area pills, a search box and every activity grouped under its area. The cards are rendered
// on the server; this only decides which ones show. Clicking the chosen pill again shows every area.

type Item = { area: string | null; text: string };

const norm = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

export function ActivityBrowser({ items, cards, areas, locale }: { items: Item[]; cards: ReactNode[]; areas: string[]; locale: "es" | "en" }) {
  const en = locale === "en";
  const [area, setArea] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const results = useRef<HTMLDivElement>(null);
  const searching = q.trim().length > 0;

  const match = useMemo(() => {
    const words = norm(q).split(/\s+/).filter(Boolean);
    return items.map((it) => words.every((w) => norm(it.text).includes(w)));
  }, [items, q]);

  const groups = (area ? [area] : areas)
    .map((name) => ({ name, idx: items.map((it, i) => (it.area === name && match[i] ? i : -1)).filter((i) => i >= 0) }))
    .filter((g) => g.idx.length > 0);
  const loose = area ? [] : items.map((it, i) => (!it.area || !areas.includes(it.area)) && match[i] ? i : -1).filter((i) => i >= 0);
  const shown = groups.reduce((n, g) => n + g.idx.length, 0) + loose.length;
  // Headings per area only pay off when areas hold a few activities each; otherwise one grid reads better.
  const grouped = !!area || groups.some((g) => g.idx.length >= 3);
  const flat = grouped ? [] : [...groups.flatMap((g) => g.idx), ...loose];
  const count = (n: number) => (en ? `${n} ${n === 1 ? "activity" : "activities"}` : `${n} ${n === 1 ? "actividad" : "actividades"}`);
  const showResults = () => results.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <>
      <h2 className="ac-invite">{en ? "Where to first? Choose an area to see its tours." : "¿Por dónde empezar? Elija una zona para ver sus tours."}</h2>

      {areas.length > 1 ? (
        <div className="ac-pills" role="group" aria-label={en ? "Areas" : "Zonas"}>
          {areas.map((name) => {
            const on = area === name;
            return (
              <button key={name} type="button" className="ac-pill" aria-pressed={on} onClick={() => setArea(on ? null : name)}>
                <span className="ac-pill__mark">{on ? AI.check() : AI.pin()}</span>
                <span>{name}</span>
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="ac-search" role="search">
        <span className="ac-search__mark">{AI.search()}</span>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); showResults(); }
            else if (e.key === "Escape") setQ("");
          }}
          placeholder={en ? "Search by name or place" : "Busque por nombre o lugar"}
          aria-label={en ? "Search activities" : "Buscar actividades"}
          autoComplete="off"
          enterKeyHint="search"
        />
        {searching ? (
          <button type="button" className="ac-search__clear" onClick={() => setQ("")} aria-label={en ? "Clear the search" : "Borrar la búsqueda"}>
            {AI.close()}
          </button>
        ) : null}
      </div>

      <div aria-live="polite">
        {searching ? (
          <div className="ac-status">
            <span>
              {shown === 0
                ? en ? `Nothing matches “${q.trim()}”${area ? ` in ${area}` : ""}.` : `Nada coincide con «${q.trim()}»${area ? ` en ${area}` : ""}.`
                : en ? `${count(shown)} match “${q.trim()}”${area ? ` in ${area}` : ""}.` : `${count(shown)} ${shown === 1 ? "coincide" : "coinciden"} con «${q.trim()}»${area ? ` en ${area}` : ""}.`}
            </span>
            {shown > 0 ? <button type="button" onClick={showResults}>{en ? "See results" : "Ver resultados"}</button> : null}
          </div>
        ) : null}
      </div>

      <div className="ac-groups" ref={results}>
        {!grouped && flat.length ? (
          <section className="ac-group" aria-label={en ? "All activities" : "Todas las actividades"}>
            <div className="ac-group__head">
              <h3 className="ac-group__title">{en ? <>All our <em>experiences.</em></> : <>Todas nuestras <em>experiencias.</em></>}</h3>
              <p className="ac-group__count">{count(flat.length)}</p>
            </div>
            <ul className="ac-grid">{flat.map((i) => <li key={i}>{cards[i]}</li>)}</ul>
          </section>
        ) : null}
        {grouped && groups.map((g) => (
          <section key={g.name} className="ac-group" aria-label={g.name}>
            <div className="ac-group__head">
              <h3 className="ac-group__title">{en ? <>Experiences in <em>{g.name}.</em></> : <>Experiencias en <em>{g.name}.</em></>}</h3>
              <p className="ac-group__count">{count(g.idx.length)}</p>
            </div>
            <ul className="ac-grid" key={`${area ?? "all"}-${g.name}`}>
              {g.idx.map((i) => <li key={i}>{cards[i]}</li>)}
            </ul>
          </section>
        ))}
        {grouped && loose.length ? (
          <section className="ac-group" aria-label={en ? "More activities" : "Más actividades"}>
            {groups.length ? (
              <div className="ac-group__head">
                <h3 className="ac-group__title">{en ? <>More <em>experiences.</em></> : <>Más <em>experiencias.</em></>}</h3>
                <p className="ac-group__count">{count(loose.length)}</p>
              </div>
            ) : null}
            <ul className="ac-grid">{loose.map((i) => <li key={i}>{cards[i]}</li>)}</ul>
          </section>
        ) : null}
        {shown === 0 && !searching ? (
          <div className="ac-group__head"><p className="ac-empty">{en ? "No activities in this area yet." : "Todavía no hay actividades en esta zona."}</p></div>
        ) : null}
      </div>
    </>
  );
}
