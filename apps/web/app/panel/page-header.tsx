import type { ReactNode } from "react";

export function PageHeader({ title, subtitle, actions, eyebrow }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode; eyebrow?: ReactNode }) {
  return (
    <header className="topbar" style={{ justifyContent: "space-between", alignItems: "flex-end" }}>
      <div className="col" style={{ gap: 4, minWidth: 0 }}>
        {eyebrow ? <p className="eyebrow panel-eyebrow">{eyebrow}</p> : null}
        <h1 className="h2" style={{ fontSize: "clamp(26px, 3vw, 34px)" }}>{title}</h1>
        {subtitle ? <p className="small" style={{ maxWidth: 720 }}>{subtitle}</p> : null}
      </div>
      {actions ? <div className="row" style={{ gap: 8 }}>{actions}</div> : null}
    </header>
  );
}

export function Flash({ ok, error }: { ok?: string | null; error?: string | null }) {
  if (!ok && !error) return null;
  return (
    <div className={`notice ${error ? "bad" : "ok"}`} role={error ? "alert" : "status"}>
      {error ?? ok}
    </div>
  );
}
