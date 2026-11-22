import { Icon } from "@altair/ui";
import { CAN, panelSessionFor } from "@/lib/panel/context";
import { PageHeader } from "../page-header";
import { ImportForm } from "./import-form";

export const metadata = { title: "Importar Excel" };

export default async function ImportPage() {
  await panelSessionFor(CAN.catalog);
  return (
    <>
      <PageHeader
        title="Importar desde Excel"
        subtitle="Suba sus zonas, tarifas, vehículos, actividades y proveedores en una sola hoja de cálculo. Se crea un borrador que usted revisa antes de publicar."
      />
      <div className="g2">
        <div className="card pad-l col" style={{ gap: 12 }}>
          <span className="ico t"><Icon name="download" /></span>
          <h2 className="h4">1. Descargue la plantilla</h2>
          <p className="small">Viene con su catálogo actual, lista para editar en Excel o Google Sheets. Los precios van sin impuestos.</p>
          <a className="btn line" href="/api/panel/catalog-xlsx" download>
            <Icon name="sheet" size={17} /> Descargar plantilla (.xlsx)
          </a>
        </div>
        <div className="card pad-l col" style={{ gap: 12 }}>
          <span className="ico t"><Icon name="upload" /></span>
          <h2 className="h4">2. Suba su archivo</h2>
          <p className="small">¿Su Excel tiene otro formato? Envíelo a su Claude conectado y él lo ordena por usted.</p>
          <ImportForm />
        </div>
      </div>
    </>
  );
}
