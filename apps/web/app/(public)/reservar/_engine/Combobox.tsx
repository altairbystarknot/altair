"use client";

import { useCallback, useId, useMemo, useRef, useState, type ReactNode } from "react";
import type { PlaceHit } from "./types";
import { Field, I, isTouch, revealPopover, useDismiss } from "./ui";

export type ComboOption = { key: string; label: string; hint?: string; group?: string; icon?: ReactNode; keywords?: string };
/** Search-as-you-type against OpenStreetMap (server action); results appear under the catalogue. */
export type ComboRemote = { search: (q: string) => Promise<PlaceHit[]>; group: string; searching: string; icon?: ReactNode };

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/**
 * Liquid-glass select with a search box inside its pop-over.
 * Order of the options: catalogue matches → places found on OpenStreetMap (`remote`, with
 * coordinates) → exactly what the customer typed (`typed`), always last, so a place that exists
 * nowhere can still be entered as written (staff see that text verbatim).
 */
export function Combobox({ label, required, value, valueIsTyped, options, onSelect, placeholder, searchPlaceholder, disabled, typed, remote, selectedLabel, noMatches, invalid, small, maxRows = 60 }: {
  label: string; required?: boolean; value: { key: string; label: string } | null; valueIsTyped?: boolean;
  options: ComboOption[]; onSelect: (key: string, typedText?: string, hit?: PlaceHit) => void;
  placeholder: string; searchPlaceholder: string; disabled?: boolean; invalid?: boolean; small?: ReactNode;
  typed?: { hint: string; min?: number }; remote?: ComboRemote; selectedLabel: string; noMatches: string;
  /** How many options are listed at once (places: 60; countries: all of them). */
  maxRows?: number;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [found, setFound] = useState<{ q: string; hits: PlaceHit[] } | null>(null);
  const [searching, setSearching] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef("");
  const wrap = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const pop = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  // With a mouse or keyboard the search box takes focus the moment it mounts. On a phone or tablet it
  // waits for a tap: focusing it would open the keyboard and the browser would shove the page up.
  const focusOnMount = useCallback((el: HTMLInputElement | null) => { if (el && !isTouch()) el.focus({ preventScroll: true }); }, []);
  useDismiss(open, wrap, close);

  /** Debounced OpenStreetMap lookup, driven by typing (no effect); stale answers are ignored. */
  const lookUp = (raw: string) => {
    if (!remote) return;
    if (timer.current) clearTimeout(timer.current);
    const q = raw.trim();
    latest.current = q;
    if (q.length < 3) { setSearching(false); return; }
    setSearching(true);
    timer.current = setTimeout(() => {
      void remote.search(q).then((hits) => {
        if (latest.current !== q) return;
        setFound({ q, hits });
        setSearching(false);
      }).catch(() => { if (latest.current === q) setSearching(false); });
    }, 320);
  };

  type Row = ComboOption & { typed?: boolean; header?: string | null; hit?: PlaceHit };
  const rows = useMemo<Row[]>(() => {
    const q = norm(query);
    const list = q ? options.filter((o) => norm(`${o.label} ${o.hint ?? ""} ${o.keywords ?? ""}`).includes(q)) : options;
    const out: Row[] = [];
    const text = query.trim().slice(0, 200);
    if (typed && text.length >= (typed.min ?? 2) && !options.some((o) => norm(o.label) === q || norm(o.keywords ?? "").split(/\s+/).includes(q))) {
      out.push({ key: `typed:${text}`, label: text, hint: typed.hint, typed: true });
    }
    // Group headers only when browsing (no search): the first row of each group carries it.
    const shown = list.slice(0, maxRows);
    const browse = shown.map((o, i) => ({ ...o, header: !q && o.group && (i === 0 || shown[i - 1]!.group !== o.group) ? o.group : null }));
    // OpenStreetMap results for the text currently typed (hidden while a newer search is pending).
    const osm: Row[] = remote && found && found.q === query.trim() && q.length >= 3
      ? found.hits
        .filter((h) => !list.some((o) => norm(o.label) === norm(h.name)))
        .map((h, i) => ({ key: h.key, label: h.name, hint: h.hint ?? undefined, icon: remote.icon, hit: h, header: i === 0 ? remote.group : null }))
      : [];
    return [...browse, ...osm, ...out];
  }, [options, query, typed, remote, found, maxRows]);

  const openWith = (seed = "") => {
    if (disabled) return;
    setQuery(seed);
    setActive(0);
    setOpen(true);
    lookUp(seed);
    requestAnimationFrame(() => revealPopover(pop.current));
  };
  const choose = (i: number) => {
    const r = rows[i];
    if (!r) return;
    if (r.hit) onSelect(r.key, undefined, r.hit);
    else if (r.key.startsWith("typed:")) onSelect(r.key, r.label);
    else onSelect(r.key);
    setOpen(false);
    trigger.current?.focus({ preventScroll: true });
  };

  return (
    <Field label={label} required={required} labelId={`${id}-l`} small={small}>
      <div ref={wrap} className="relative">
        <button
          ref={trigger} type="button" className="be-control" data-open={open || undefined} aria-haspopup="listbox" aria-expanded={open}
          aria-labelledby={`${id}-l ${id}-v`} data-invalid={invalid || undefined} disabled={disabled}
          onClick={() => (open ? setOpen(false) : openWith())}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") { e.preventDefault(); openWith(); }
            else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); openWith(e.key); }
          }}
        >
          <span id={`${id}-v`} className={`be-control__value ${value ? "" : "be-placeholder"}`}>{value?.label ?? placeholder}</span>
          {value && <span className="be-selected-tag" aria-label={selectedLabel}>{I.check()}{valueIsTyped ? selectedLabel : null}</span>}
          {I.chevDown({ className: "be-control__chev" })}
        </button>
        {open && (
          <div ref={pop} className="be-pop">
            <div className="be-pop__search">
              {I.search({ className: "be-control__icon" })}
              <input
                ref={focusOnMount} id={`${id}-q`} value={query} placeholder={searchPlaceholder} autoComplete="off" maxLength={200}
                role="combobox" aria-expanded="true" aria-controls={`${id}-list`} aria-autocomplete="list"
                aria-activedescendant={rows[active] ? `${id}-o${active}` : undefined}
                onChange={(e) => { setQuery(e.target.value); setActive(0); lookUp(e.target.value); }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, rows.length - 1)); }
                  else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
                  else if (e.key === "Enter") { e.preventDefault(); choose(active); }
                  else if (e.key === "Tab") setOpen(false);
                }}
              />
            </div>
            <ul id={`${id}-list`} role="listbox" aria-labelledby={`${id}-l`} className="be-pop__list">
              {rows.length === 0 && !searching && <li className="be-pop__empty">{noMatches}</li>}
              {rows.length === 0 && searching && remote && <li className="be-pop__status" aria-live="polite">{remote.searching}</li>}
              {rows.map((r, i) => {
                const header = r.header;
                const selected = !!value && (r.typed ? valueIsTyped && value.label === r.label : r.hit ? valueIsTyped && value.label === r.label : value.key === r.key);
                return (
                  <li key={r.key} role="presentation">
                    {/* "Searching OpenStreetMap…" sits just above the typed option while a lookup runs. */}
                    {r.typed && remote && searching && <div className="be-pop__status" aria-live="polite">{remote.searching}</div>}
                    {header && <div className="be-pop__group" role="presentation">{header}</div>}
                    <div
                      id={`${id}-o${i}`} role="option" aria-selected={selected} data-active={i === active || undefined}
                      className={`be-option ${r.typed ? "be-option--typed" : ""}`}
                      onPointerDown={(e) => e.preventDefault()} onClick={() => choose(i)} onPointerEnter={() => setActive(i)}
                    >
                      {r.icon && <span className="be-option__icon">{r.icon}</span>}
                      <span className="be-option__text">{r.label}{r.hint && !r.typed && <small>{r.hint}</small>}</span>
                      {r.typed && <span className="be-option__tag">{r.hint}</span>}
                      {selected && <span className="be-selected-tag">{I.check()}{selectedLabel}</span>}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </Field>
  );
}
