"use client";

import { useSyncExternalStore } from "react";
import { cartItemSchema, type CartItem } from "./cart-types";

// The cart lives in the visitor's browser (localStorage of THIS business's origin): only choices, no
// prices. Invalid or tampered entries are dropped on read; the server re-prices everything anyway.

const KEY = "altair_cart_v1";
const listeners = new Set<() => void>();
let cache: CartItem[] | null = null;
let cacheRaw: string | null = null;

function read(): CartItem[] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    raw = null;
  }
  if (raw === cacheRaw && cache) return cache;
  cacheRaw = raw;
  try {
    const arr = JSON.parse(raw ?? "[]");
    cache = Array.isArray(arr) ? arr.map((x) => cartItemSchema.safeParse(x)).filter((r) => r.success).map((r) => r.data!) : [];
  } catch {
    cache = [];
  }
  return cache;
}

function write(items: CartItem[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items.slice(0, 12)));
  } catch {
    // storage blocked: the cart lives only for this page view
  }
  cache = null;
  listeners.forEach((l) => l());
}

const EMPTY: CartItem[] = [];

export function useCart(): CartItem[] {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      const onStorage = (e: StorageEvent) => e.key === KEY && cb();
      window.addEventListener("storage", onStorage);
      return () => {
        listeners.delete(cb);
        window.removeEventListener("storage", onStorage);
      };
    },
    read,
    () => EMPTY,
  );
}

export function newKey(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function addToCart(items: CartItem[]) {
  write([...read(), ...items]);
}

/** Swap one cart line for its edited version (same position); adds at the end if it is gone. */
export function replaceInCart(key: string, items: CartItem[]) {
  const cur = read();
  const at = cur.findIndex((i) => i.key === key);
  if (at < 0) return write([...cur, ...items]);
  write([...cur.slice(0, at), ...items, ...cur.slice(at + 1)]);
}

/** One cart line by key (for "edit"), read straight from storage. */
export function getCartItem(key: string): CartItem | null {
  if (typeof window === "undefined") return null;
  return read().find((i) => i.key === key) ?? null;
}

export function removeFromCart(key: string) {
  write(read().filter((i) => i.key !== key));
}

export function clearCart() {
  write([]);
}
