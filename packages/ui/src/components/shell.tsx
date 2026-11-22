import type { ComponentType, ReactNode } from "react";
import { cx } from "../cx";
import { AltairIcon, AltairLogo, Icon, type IconName } from "./Icon";

// Panel shell: the glass sidebar and the Altair mark from the canvas. Navigation-agnostic: pass Next's
// <Link> as `LinkComponent` to get client-side navigation; plain <a> is the default.

type LinkLike = ComponentType<{ href: string; className?: string; "aria-current"?: "page"; children?: ReactNode }>;

export function AltairMark({ subtitle }: { subtitle?: ReactNode }) {
  return (
    <div className="row" style={{ gap: 10, padding: "6px 8px 14px", flexWrap: "nowrap" }}>
      <span style={{ flex: "none", display: "grid", filter: "drop-shadow(0 8px 14px rgba(0,43,66,.22))" }}>
        <AltairIcon size={38} />
      </span>
      <span className="col" style={{ gap: 2, minWidth: 0 }}>
        <AltairLogo size={22} />
        {subtitle ? (
          <span className="tiny" style={{ fontSize: 11.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {subtitle}
          </span>
        ) : null}
      </span>
    </div>
  );
}

export type SidebarEntry =
  | { kind: "group"; label: string }
  | {
      kind: "item";
      label: string;
      icon: IconName;
      href?: string;
      active?: boolean;
      badge?: ReactNode;
      /** Shown greyed with a "Pronto" tag; not a link. */
      soon?: boolean;
    };

export function Sidebar({
  entries,
  header,
  footer,
  LinkComponent,
  label = "Menú del panel",
}: {
  entries: ReadonlyArray<SidebarEntry>;
  header?: ReactNode;
  footer?: ReactNode;
  LinkComponent?: LinkLike;
  label?: string;
}) {
  const A: LinkLike = LinkComponent ?? ((p) => <a {...p} />);
  return (
    <nav className="side glass" aria-label={label}>
      {header}
      {entries.map((e, i) => {
        if (e.kind === "group") {
          return (
            <span key={`g${i}`} className="grp">
              {e.label}
            </span>
          );
        }
        const content = (
          <>
            <Icon name={e.icon} />
            {e.label}
            {e.soon ? <span className="soon">Pronto</span> : e.badge ?? null}
          </>
        );
        if (e.soon || !e.href) {
          return (
            <span key={`i${i}`} className="item" aria-disabled="true">
              {content}
            </span>
          );
        }
        return (
          <A key={`i${i}`} href={e.href} className={cx("item", e.active && "on")} aria-current={e.active ? "page" : undefined}>
            {content}
          </A>
        );
      })}
      {footer ? <div style={{ marginTop: "auto", paddingTop: 12 }}>{footer}</div> : null}
    </nav>
  );
}
