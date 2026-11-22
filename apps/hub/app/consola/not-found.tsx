import Link from "next/link";
import { AltairLogo } from "@altair/ui";

export default function ConsoleNotFound() {
  return (
    <main className="h-con-login">
      <div className="h-con-card">
        <AltairLogo size={30} />
        <p className="h-kicker">Consola Starknot</p>
        <h1 className="h-h2">Esta página <em>no existe.</em></h1>
        <Link className="btn tint" href="/consola">Ir a la consola</Link>
      </div>
    </main>
  );
}
