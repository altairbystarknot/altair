"use client";

import { useState } from "react";
import {
  Button,
  Card,
  Chip,
  Counter,
  Field,
  Glass,
  Kpi,
  Notice,
  Segmented,
  StatusPill,
  Steps,
  Switch,
  TextInput,
} from "@altair/ui";

// Live gallery of @altair/ui (development only). The same components the panel and site use.
export function Gallery() {
  const [tab, setTab] = useState<"transfer" | "tours">("transfer");
  const [on, setOn] = useState(true);
  const [adults, setAdults] = useState(2);
  const [chip, setChip] = useState("Guanacaste");

  return (
    <div className="col" style={{ gap: 24 }}>
      <Card pad="lg">
        <div className="col" style={{ gap: 14 }}>
          <h2 className="h4">Botones</h2>
          <div className="row">
            <Button>Primario</Button>
            <Button variant="line">Secundario</Button>
            <Button variant="glass">Glass</Button>
            <Button variant="gold">Dorado</Button>
            <Button variant="ghost">Fantasma</Button>
            <Button size="sm">Chico</Button>
            <Button size="lg">Grande</Button>
            <Button disabled>Deshabilitado</Button>
          </div>
        </div>
      </Card>

      <Card pad="lg">
        <div className="col" style={{ gap: 14 }}>
          <h2 className="h4">Controles</h2>
          <Segmented
            label="Tipo de servicio"
            value={tab}
            onChange={setTab}
            options={[
              { value: "transfer", label: "Transporte privado" },
              { value: "tours", label: "Actividades" },
            ]}
          />
          <div className="row">
            {["Todas", "Guanacaste", "La Fortuna", "Monteverde"].map((c) => (
              <Chip key={c} selected={chip === c} onClick={() => setChip(c)}>
                {c}
              </Chip>
            ))}
          </div>
          <Switch checked={on} onCheckedChange={setOn} label="Recogida en el hotel" description="Incluida en esta zona" />
          <div className="row" style={{ gap: 16 }}>
            <span>Adultos</span>
            <Counter label="Adultos" value={adults} onChange={setAdults} min={1} max={14} />
          </div>
          <Steps
            items={[
              { label: "Ruta", state: "done" },
              { label: "Vehículo", state: "current" },
              { label: "Extras", state: "todo" },
              { label: "Resumen", state: "todo" },
            ]}
          />
        </div>
      </Card>

      <Card pad="lg">
        <div className="g2" style={{ gap: 14 }}>
          <Field label="Desde" htmlFor="g-from">
            <TextInput id="g-from" icon="plane" defaultValue="Aeropuerto Juan Santamaría (SJO)" />
          </Field>
          <Field label="Correo" htmlFor="g-mail" error="Revisá el correo">
            <TextInput id="g-mail" icon="users" defaultValue="ana@" invalid />
          </Field>
        </div>
      </Card>

      <div className="g4">
        <Kpi label="Servicios hoy" value="14" note="3 traslados de aeropuerto" />
        <Kpi label="Reservas nuevas" value="9" note="+4 vs. ayer" />
        <Kpi label="Cobrado este mes" value="$18,420" />
        <Kpi label="Ocupación" value="82%" />
      </div>

      <Glass style={{ borderRadius: 28, padding: 22 }}>
        <div className="col" style={{ gap: 10 }}>
          <h2 className="h4">Estados</h2>
          <div className="row">
            <StatusPill tone="ok">Pagada</StatusPill>
            <StatusPill tone="warn">Asignar</StatusPill>
            <StatusPill tone="bad">Cancelada</StatusPill>
            <StatusPill tone="info">Por cotizar</StatusPill>
            <StatusPill tone="gold">Pago pendiente</StatusPill>
            <StatusPill tone="mute">Reembolsada</StatusPill>
          </div>
          <Notice tone="ok">Guardado. El sitio ya muestra los cambios.</Notice>
          <Notice tone="warn">Falta 1 persona para que salga el tour del sábado.</Notice>
        </div>
      </Glass>
    </div>
  );
}
