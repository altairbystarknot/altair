"use client";

import { useActionState } from "react";
import { Button, Field, Notice, TextInput } from "@altair/ui";
import { acceptInvite, claimInstance, type FormState } from "./actions";

const initial: FormState = { error: null };

export function ClaimForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(claimInstance, initial);
  return (
    <form action={action} className="col" style={{ gap: 14 }}>
      <input type="hidden" name="token" value={token} />
      <Field label="Nombre completo" htmlFor="fullName">
        <TextInput id="fullName" name="fullName" autoComplete="name" required icon="users" maxLength={120} />
      </Field>
      <Field label="Correo" htmlFor="email" hint="Con este correo entrará al panel.">
        <TextInput id="email" name="email" type="email" autoComplete="username" required icon="mail" maxLength={200} />
      </Field>
      <Field label="Contraseña" htmlFor="password" hint="Al menos 10 caracteres. Luego activará un código en su celular.">
        <TextInput id="password" name="password" type="password" autoComplete="new-password" required minLength={10} icon="lock" />
      </Field>
      {state.error ? <Notice tone="bad">{state.error}</Notice> : null}
      <Button type="submit" size="lg" disabled={pending} aria-busy={pending} style={{ width: "100%" }}>
        {pending ? "Creando su acceso…" : "Crear mi acceso"}
      </Button>
    </form>
  );
}

export function InviteForm({ token, email, fullName }: { token: string; email: string; fullName: string }) {
  const [state, action, pending] = useActionState(acceptInvite, initial);
  return (
    <form action={action} className="col" style={{ gap: 14 }}>
      <input type="hidden" name="token" value={token} />
      <Field label="Correo" htmlFor="email">
        <TextInput id="email" value={email} readOnly icon="mail" />
      </Field>
      <Field label="Nombre completo" htmlFor="fullName">
        <TextInput id="fullName" name="fullName" defaultValue={fullName} autoComplete="name" required icon="users" maxLength={120} />
      </Field>
      <Field label="Contraseña" htmlFor="password" hint="Si ya tiene cuenta en Altair, use su contraseña actual.">
        <TextInput id="password" name="password" type="password" autoComplete="new-password" required minLength={10} icon="lock" />
      </Field>
      {state.error ? <Notice tone="bad">{state.error}</Notice> : null}
      <Button type="submit" size="lg" disabled={pending} aria-busy={pending} style={{ width: "100%" }}>
        {pending ? "Procesando…" : "Unirme al equipo"}
      </Button>
    </form>
  );
}
