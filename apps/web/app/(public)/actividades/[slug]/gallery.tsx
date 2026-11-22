"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AI } from "../_ui/icons";

/** Photo carousel: one large photo (swipe, arrows, keyboard), a strip of thumbnails, and a full-size viewer. */
export function Gallery({ photos, title, locale }: { photos: string[]; title: string; locale: "es" | "en" }) {
  const en = locale === "en";
  const [i, setI] = useState(0);
  const [viewer, setViewer] = useState(false);
  const startX = useRef<number | null>(null);
  const strip = useRef<HTMLUListElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const n = photos.length;
  const step = useCallback((by: number) => setI((x) => (x + by + n) % n), [n]);

  useEffect(() => {
    const list = strip.current;
    const item = list?.children.item(i) as HTMLElement | null | undefined;
    if (!list || !item) return;
    const left = item.offsetLeft - list.offsetLeft;
    if (left < list.scrollLeft || left + item.offsetWidth > list.scrollLeft + list.clientWidth) {
      list.scrollTo({ left: Math.max(0, left - (list.clientWidth - item.offsetWidth) / 2), behavior: "smooth" });
    }
  }, [i]);

  if (n === 0) {
    return (
      <div className="ac-gallery">
        <div className="ac-gallery__frame ac-gallery__frame--empty" aria-hidden="true">{AI.compass()}</div>
      </div>
    );
  }
  const many = n > 1;
  const alt = (k: number) => (many ? `${title} · ${en ? "photo" : "foto"} ${k + 1}/${n}` : title);

  return (
    <div
      className="ac-gallery" role="region" aria-roledescription={en ? "carousel" : "carrusel"} aria-label={en ? `${title} photos` : `Fotos de ${title}`}
      onKeyDown={(e) => {
        if (!many || viewer) return;
        if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
        else if (e.key === "ArrowRight") { e.preventDefault(); step(1); }
      }}
    >
      <div
        className="ac-gallery__frame"
        onPointerDown={(e) => { startX.current = e.clientX; }}
        onPointerUp={(e) => {
          const from = startX.current;
          startX.current = null;
          if (!many || from === null) return;
          const dx = e.clientX - from;
          if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1);
        }}
      >
        <button ref={opener} type="button" className="ac-gallery__open" onClick={() => setViewer(true)} aria-label={en ? "View full size" : "Ver en tamaño completo"}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img key={photos[i]} src={photos[i]} alt={alt(i)} decoding="async" fetchPriority={i === 0 ? "high" : "auto"} draggable={false} />
        </button>
        <span className="ac-gallery__zoom" aria-hidden="true">{AI.expand()}</span>
        {many ? (
          <>
            <span className="ac-gallery__count" aria-live="polite">{i + 1} / {n}</span>
            <div className="ac-gallery__arrows">
              <button type="button" className="ac-gallery__arrow" aria-label={en ? "Previous photo" : "Foto anterior"} onClick={() => step(-1)}>{AI.chevLeft()}</button>
              <button type="button" className="ac-gallery__arrow" aria-label={en ? "Next photo" : "Foto siguiente"} onClick={() => step(1)}>{AI.chevRight()}</button>
            </div>
          </>
        ) : null}
      </div>
      {many ? (
        <ul className="ac-gallery__thumbs" ref={strip}>
          {photos.map((p, k) => (
            <li key={`${p}-${k}`}>
              <button type="button" className="ac-gallery__thumb" aria-current={k === i ? "true" : undefined} aria-label={`${en ? "Photo" : "Foto"} ${k + 1}`} onClick={() => setI(k)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p} alt="" loading="lazy" decoding="async" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {viewer ? (
        <Lightbox photos={photos} index={i} onIndex={setI} title={title} en={en} onClose={() => { setViewer(false); opener.current?.focus({ preventScroll: true }); }} />
      ) : null}
    </div>
  );
}

function Lightbox({ photos, index, onIndex, onClose, title, en }: {
  photos: string[]; index: number; onIndex: (i: number) => void; onClose: () => void; title: string; en: boolean;
}) {
  const n = photos.length;
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    close.current?.focus({ preventScroll: true });
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft" && n > 1) onIndex((index - 1 + n) % n);
      else if (e.key === "ArrowRight" && n > 1) onIndex((index + 1) % n);
    };
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("keydown", key); document.documentElement.style.overflow = prev; };
  }, [index, n, onClose, onIndex]);
  return createPortal(
    <div className="ac-lightbox" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <button ref={close} type="button" className="ac-lightbox__close" onClick={onClose} aria-label={en ? "Close" : "Cerrar"}>{AI.close()}</button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img key={photos[index]} src={photos[index]} alt={`${title} · ${index + 1}/${n}`} />
      {n > 1 ? (
        <>
          <button type="button" className="ac-lightbox__nav ac-lightbox__nav--prev" onClick={() => onIndex((index - 1 + n) % n)} aria-label={en ? "Previous photo" : "Foto anterior"}>{AI.chevLeft()}</button>
          <button type="button" className="ac-lightbox__nav ac-lightbox__nav--next" onClick={() => onIndex((index + 1) % n)} aria-label={en ? "Next photo" : "Foto siguiente"}>{AI.chevRight()}</button>
          <span className="ac-lightbox__count">{index + 1} / {n}</span>
        </>
      ) : null}
    </div>,
    document.body,
  );
}

/** Description / includes / what to bring, as tabs. */
export function InfoTabs({ tabs }: { tabs: Array<{ id: string; label: string; body: ReactNode }> }) {
  const [on, setOn] = useState(tabs[0]?.id ?? "");
  const cur = tabs.find((t) => t.id === on) ?? tabs[0];
  if (!cur) return null;
  return (
    <div className="ac-tabs">
      <div className="ac-tabs__list" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id} type="button" role="tab" id={`ac-tab-${t.id}`} aria-selected={t.id === cur.id} aria-controls={`ac-panel-${t.id}`}
            tabIndex={t.id === cur.id ? 0 : -1} className="ac-tabs__tab" onClick={() => setOn(t.id)}
            onKeyDown={(e) => {
              const k = tabs.findIndex((x) => x.id === cur.id);
              const next = e.key === "ArrowRight" ? tabs[(k + 1) % tabs.length] : e.key === "ArrowLeft" ? tabs[(k - 1 + tabs.length) % tabs.length] : null;
              if (next) { e.preventDefault(); setOn(next.id); document.getElementById(`ac-tab-${next.id}`)?.focus(); }
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`ac-panel-${cur.id}`} aria-labelledby={`ac-tab-${cur.id}`} className="ac-tabs__panel" key={cur.id}>
        {cur.body}
      </div>
    </div>
  );
}
