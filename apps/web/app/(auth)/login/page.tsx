import type { Metadata } from "next";
import { safePanelReturn } from "@/lib/auth/safe-return";
import { isSupabaseConfigured } from "@/lib/env";
import { LoginForm } from "../forms";

export const metadata: Metadata = { title: "Entrar al panel" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <div className="col" style={{ gap: 18 }}>
      <div className="col" style={{ gap: 4 }}>
        <h1 className="h3">Entrar al panel</h1>
        <p className="small">Con su correo, su contraseña y un código de su celular.</p>
      </div>
      <LoginForm next={safePanelReturn(next)} configured={isSupabaseConfigured()} />
    </div>
  );
}
