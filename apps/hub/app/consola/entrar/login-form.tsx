"use client";

import { useActionState } from "react";
import { Icon } from "@altair/ui";
import { consoleLogin, type FormState } from "../../actions";

const initial: FormState = { error: null };

export function LoginForm() {
  const [state, action, pending] = useActionState(consoleLogin, initial);
  return (
    <form action={action} className="h-form h-con-loginform">
      <div className="h-field">
        <label htmlFor="password">Contraseña de la consola</label>
        <input className="h-inp" id="password" name="password" type="password" required autoComplete="current-password" autoFocus />
      </div>
      {state.error ? <p className="h-error" role="alert">{state.error}</p> : null}
      <button type="submit" className="btn tint lg h-submit" disabled={pending}>
        {pending ? "Entrando…" : "Entrar"} {pending ? null : <Icon name="arrowRight" size={18} />}
      </button>
    </form>
  );
}
