"use client";

import { useActionState } from "react";
import { Button, Notice } from "@altair/ui";
import { importWorkbook, type ImportState } from "../borradores/actions";

const initial: ImportState = { error: null, problems: [] };

export function ImportForm() {
  const [state, action, pending] = useActionState(importWorkbook, initial);
  return (
    <form action={action} className="col" style={{ gap: 12 }}>
      <input
        type="file"
        name="file"
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        required
        className="input"
        style={{ padding: 12 }}
      />
      {state.error ? (
        <Notice tone="bad">
          {state.error}
          {state.problems.length ? (
            <ul style={{ marginTop: 8, paddingLeft: 18, listStyle: "disc" }}>
              {state.problems.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          ) : null}
        </Notice>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Leyendo…" : "Crear borrador"}
      </Button>
    </form>
  );
}
