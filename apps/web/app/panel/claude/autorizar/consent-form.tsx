"use client";

import { useState, useTransition } from "react";
import { Button, Notice } from "@altair/ui";
import { approveConnection, denyConnection } from "../actions";

export function ConsentForm({ options }: { options: Array<{ id: string; label: string; detail: string; checked: boolean }> }) {
  const [chosen, setChosen] = useState<string[]>(options.filter((o) => o.checked).map((o) => o.id));
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const go = (fn: () => Promise<{ url: string | null; error: string | null }>) =>
    start(async () => {
      setError(null);
      const r = await fn();
      if (r.error) setError(r.error);
      else if (r.url) window.location.assign(r.url);
    });

  return (
    <div className="col" style={{ gap: 12 }}>
      <span className="lbl">Permisos</span>
      {options.map((o) => (
        <label key={o.id} className="opt" style={{ alignItems: "flex-start", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={chosen.includes(o.id)}
            onChange={(e) => setChosen((c) => (e.target.checked ? [...c, o.id] : c.filter((x) => x !== o.id)))}
            style={{ width: 20, height: 20, marginTop: 2 }}
          />
          <span className="col" style={{ gap: 2 }}>
            <b>{o.label}</b>
            <span className="tiny">{o.detail}</span>
          </span>
        </label>
      ))}
      {error ? <Notice tone="bad">{error}</Notice> : null}
      <div className="row" style={{ gap: 10 }}>
        <Button size="lg" disabled={pending || chosen.length === 0} onClick={() => go(() => approveConnection(chosen))}>
          {pending ? "Conectando…" : "Permitir y conectar"}
        </Button>
        <Button variant="line" size="lg" disabled={pending} onClick={() => go(() => denyConnection())}>
          No permitir
        </Button>
      </div>
    </div>
  );
}
