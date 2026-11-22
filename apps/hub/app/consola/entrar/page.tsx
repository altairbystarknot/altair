import { AltairLogo } from "@altair/ui";
import { LoginForm } from "./login-form";

export const metadata = { title: "Entrar" };

export default function ConsoleLogin() {
  return (
    <main className="h-con-login">
      <div className="h-con-card">
        <AltairLogo size={34} />
        <p className="h-kicker">Consola Starknot</p>
        <h1 className="h-h2">Entrar a <em>la consola.</em></h1>
        <p className="h-con-hint">Acceso solo para el equipo de Starknot. Aquí se revisan y aprueban las solicitudes de Altair.</p>
        <LoginForm />
      </div>
    </main>
  );
}
