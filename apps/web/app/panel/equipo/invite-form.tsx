"use client";

import { useActionState } from "react";
import { Button, Notice } from "@altair/ui";
import { CopyField } from "../claude/copy-field";
import { inviteMember, type InviteState } from "./actions";

const initial: InviteState = { error: null, link: null, email: null };

export function InviteForm({ canInviteAdmin }: { canInviteAdmin: boolean }) {
  const [state, action, pending] = useActionState(inviteMember, initial);
  return (
    <div className="col" style={{ gap: 10 }}>
      <form action={action} className="col" style={{ gap: 8 }}>
        <input name="email" type="email" required placeholder="correo@ejemplo.com" className="input" style={{ minHeight: 44 }} />
        <input name="fullName" placeholder="Nombre (opcional)" className="input" style={{ minHeight: 44 }} />
        <select name="role" className="input" style={{ minHeight: 44 }} defaultValue="ops">
          {canInviteAdmin ? <option value="admin">Administración</option> : null}
          <option value="ops">Operaciones</option>
          <option value="finance">Finanzas</option>
          <option value="readonly">Solo lectura</option>
        </select>
        <Button type="submit" disabled={pending}>{pending ? "Creando…" : "Crear invitación"}</Button>
      </form>
      {state.error ? <Notice tone="bad">{state.error}</Notice> : null}
      {state.link ? (
        <>
          <Notice tone="ok">Invitación creada para {state.email}. Envíele este enlace por WhatsApp o correo (válido por 7 días, un solo uso).</Notice>
          <CopyField label="Enlace de invitación" value={state.link} />
        </>
      ) : null}
    </div>
  );
}
