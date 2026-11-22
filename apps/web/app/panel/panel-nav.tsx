"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { AltairMark, Icon, Sidebar, type IconName, type SidebarEntry } from "@altair/ui";

// The panel's sidebar. Entries a role cannot use are hidden (the server checks again on every page).
// On tablets and phones it collapses into a bar with a menu button (CSS in @altair/ui, .panel-nav*); the
// menu closes by itself on navigation because it is only "open" for the path where it was opened.
export function PanelNav({ businessName, footer, role, drafts, setupDone }: { businessName: string; footer: ReactNode; role: string; drafts: number; setupDone: boolean }) {
  const path = usePathname();
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === path;
  const is = (href: string) => (href === "/panel" ? path === "/panel" : path === href || path.startsWith(`${href}/`));
  const admin = role === "owner" || role === "admin";
  const ops = admin || role === "ops";
  const money = admin || role === "finance";
  const item = (label: string, icon: IconName, href: string, show = true): SidebarEntry[] => (show ? [{ kind: "item", label, icon, href, active: is(href) }] : []);
  const entries: SidebarEntry[] = [
    ...(admin && !setupDone ? item("Configurar mi negocio", "sparkle", "/panel/configurar") : []),
    { kind: "group", label: "Operación" },
    ...item("Hoy", "sun", "/panel"),
    ...item("Reservas", "ticket", "/panel/reservas"),
    ...item("Despacho", "clipboard", "/panel/despacho", ops),
    ...item("Proveedores", "users", "/panel/proveedores", ops),
    { kind: "group", label: "Catálogo" },
    ...item("Transporte", "car", "/panel/transporte"),
    ...item("Actividades", "mountain", "/panel/actividades"),
    ...item(drafts > 0 ? `Borradores (${drafts})` : "Borradores", "edit", "/panel/borradores"),
    ...item("Importar Excel", "sheet", "/panel/importar", admin),
    { kind: "group", label: "Negocio" },
    ...item("Claude", "sparkle", "/panel/claude"),
    ...item("Sitio y marca", "globe", "/panel/sitio", admin),
    ...item("Cobros", "card", "/panel/cobros", money),
    ...item("Equipo", "users", "/panel/equipo", admin),
    ...item("Ajustes del negocio", "sliders", "/panel/ajustes", admin),
  ];
  return (
    <div className={`panel-nav${open ? " open" : ""}`}>
      <div className="panel-nav-bar glass">
        <div style={{ minWidth: 0, marginBottom: -8 }}>
          <AltairMark subtitle={businessName} />
        </div>
        <button type="button" className="btn line sm" aria-expanded={open} aria-controls="panel-menu" onClick={() => setOpenAt(open ? null : path)}>
          <Icon name={open ? "x" : "menu"} size={17} />
          Menú
        </button>
      </div>
      <div id="panel-menu" className="panel-nav-menu">
        <Sidebar header={<AltairMark subtitle={businessName} />} entries={entries} footer={footer} LinkComponent={Link} />
      </div>
    </div>
  );
}
