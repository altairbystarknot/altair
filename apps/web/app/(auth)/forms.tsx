"use client";

import { useActionState } from "react";
import { Button, Field, Notice, TextInput } from "@altair/ui";
import { login, submitChallenge, submitEnrollment, type FormState } from "./actions";

const initial: FormState = { error: null };

export function LoginForm({ next, configured }: { next: string; configured: boolean }) {
  const [state, action, pending] = useActionState(login, initial);
  return (
    <form action={action} className="col" style={{ gap: 14 }}>
      <input type="hidden" name="next" value={next} />
      {!configured ? (
        <Notice tone="warn">Este entorno todavía no tiene Supabase configurado. El acceso se activa al conectar la base del negocio.</Notice>
      ) : null}
      <Field label="Correo" htmlFor="email">
        <TextInput id="email" name="email" type="email" autoComplete="username" required icon="mail" placeholder="nombre@negocio.com" />
      </Field>
      <Field label="Contraseña" htmlFor="password">
        <TextInput id="password" name="password" type="password" autoComplete="current-password" required icon="lock" />
      </Field>
      {state.error ? <Notice tone="bad">{state.error}</Notice> : null}
      <Button type="submit" size="lg" disabled={pending} aria-busy={pending} style={{ width: "100%" }}>
        {pending ? "Entrando…" : "Entrar"}
      </Button>
    </form>
  );
}

export function ChallengeForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(submitChallenge, initial);
  return (
    <form action={action} className="col" style={{ gap: 14 }}>
      <input type="hidden" name="next" value={next} />
      <Field label="Código de 6 dígitos" htmlFor="code" hint="Abra su app de autenticación (Google Authenticator, 1Password, Authy…).">
        <TextInput
          id="code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9 ]{6,7}"
          maxLength={7}
          required
          icon="shield"
          placeholder="123 456"
          autoFocus
        />
      </Field>
      {state.error ? <Notice tone="bad">{state.error}</Notice> : null}
      <Button type="submit" size="lg" disabled={pending} aria-busy={pending} style={{ width: "100%" }}>
        {pending ? "Verificando…" : "Verificar"}
      </Button>
    </form>
  );
}

export function EnrollForm({ next, factorId }: { next: string; factorId: string }) {
  const [state, action, pending] = useActionState(submitEnrollment, initial);
  return (
    <form action={action} className="col" style={{ gap: 14 }}>
      <input type="hidden" name="next" value={next} />
      <input type="hidden" name="factorId" value={factorId} />
      <Field label="Código que muestra la app" htmlFor="code">
        <TextInput
          id="code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9 ]{6,7}"
          maxLength={7}
          required
          icon="shield"
          placeholder="123 456"
        />
      </Field>
      {state.error ? <Notice tone="bad">{state.error}</Notice> : null}
      <Button type="submit" size="lg" disabled={pending} aria-busy={pending} style={{ width: "100%" }}>
        {pending ? "Activando…" : "Activar y entrar"}
      </Button>
    </form>
  );
}
