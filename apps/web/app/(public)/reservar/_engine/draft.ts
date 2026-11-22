"use client";

import { useMemo, useState, useSyncExternalStore } from "react";

/**
 * The booking a visitor is building, kept in THIS TAB (sessionStorage): a refresh, or a visit to the rest
 * of the website, never loses it; closing the tab ends it . It is cleared the
 * moment the request is sent. Nothing here is ever sent anywhere: it only lives in the visitor's browser.
 *
 * Two parts: `state` (what the engine needs to put the customer back exactly where they were) and
 * `summary` (plain labels for the cart button on the website, which has no catalogue to read).
 */
const KEY = "altair-transfer-draft-v1";
const EVENT = "altair-transfer-draft";

export type DraftSummaryLeg = { from: string | null; to: string | null; date: string; time: string; vehicle: string | null };
export type DraftSummary = { legs: DraftSummaryLeg[] };
type Stored<T> = { v: 1; state: T; summary: DraftSummary };

export function readDraftRaw(): string | null {
  try {
    return window.sessionStorage.getItem(KEY);
  } catch {
    return null; // storage blocked (private mode, settings): the engine simply starts fresh
  }
}

export function parseDraft<T>(raw: string | null): Stored<T> | null {
  if (!raw) return null;
  try {
    const d = JSON.parse(raw) as Stored<T>;
    return d && d.v === 1 && d.state && d.summary && Array.isArray(d.summary.legs) ? d : null;
  } catch {
    return null;
  }
}

export function writeDraft<T>(state: T, summary: DraftSummary): void {
  try {
    const raw = JSON.stringify({ v: 1, state, summary } satisfies Stored<T>);
    if (raw === window.sessionStorage.getItem(KEY)) return;
    window.sessionStorage.setItem(KEY, raw);
    window.dispatchEvent(new Event(EVENT));
  } catch {
    // full or blocked storage: the booking still works, it just is not kept
  }
}

export function clearDraft(): void {
  try {
    window.sessionStorage.removeItem(KEY);
    window.dispatchEvent(new Event(EVENT));
  } catch {
    // nothing to clear
  }
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}
const serverSnapshot = (): string | null => null;
const noSubscribe = () => () => {};
const notYet = (): undefined => undefined;

/**
 * The stored draft, kept up to date (the website's cart buttons), read without a hydration mismatch: the
 * server (and the first client paint) know of no draft; React re-renders with the stored one right after
 * hydration. The snapshot is the raw string, a stable primitive, so nothing re-renders unless it changed.
 */
export function useDraft<T>(): Stored<T> | null {
  const raw = useSyncExternalStore(subscribe, readDraftRaw, serverSnapshot);
  return useMemo(() => parseDraft<T>(raw), [raw]);
}

/**
 * The draft this tab had kept when the booking engine opened, read ONCE: everything stored after that is
 * the engine's own writing. Null on the server and while hydrating, then what was found.
 */
export function useOpeningDraft<T>(): Stored<T> | null {
  const now = useSyncExternalStore<string | null | undefined>(noSubscribe, readDraftRaw, notYet);
  const [opened, setOpened] = useState<{ raw: string | null } | null>(null);
  if (opened === null && now !== undefined) setOpened({ raw: now });
  return useMemo(() => parseDraft<T>(opened?.raw ?? null), [opened]);
}

/** How many legs the visitor has started (at least one of its places chosen). */
export function draftCount(summary: DraftSummary | null | undefined): number {
  return summary ? summary.legs.filter((l) => l.from || l.to).length : 0;
}
