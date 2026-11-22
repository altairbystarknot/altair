"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** The booking engine, the details step and the confirmation are full-screen: no site header or footer. */
const FULL_SCREEN = [/^\/reservar\/traslado/, /^\/carrito/, /^\/reserva\//];

export function HideOnBooking({ children }: { children: ReactNode }) {
  const path = usePathname() ?? "/";
  return FULL_SCREEN.some((r) => r.test(path)) ? null : <>{children}</>;
}
