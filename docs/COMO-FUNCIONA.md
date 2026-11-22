# Cómo funciona Altair (en palabras simples)

## Las tres caras

| Quién | Dónde entra | Qué hace |
|---|---|---|
| **El turista** | El sitio del negocio (su dominio) | Busca un traslado o una actividad, ve el precio final al instante y reserva. |
| **El dueño y su equipo** | El panel del negocio (`/panel` en el mismo dominio) | Ve las reservas, despacha los servicios, carga tarifas y actividades, cambia la marca y registra pagos. |
| **El Claude del dueño** | Su propia app de Claude (web, escritorio o celular) | Maneja el negocio conversando: consulta, asigna, carga tarifas como borrador y redacta mensajes. |

## Qué pasa cuando alguien compra Altair

1. **Solicita.** Entra a la web de Altair y llena el formulario (nombre del negocio, contacto, qué vende).
2. **Starknot aprueba.** En la consola, Starknot toca «Aprobar y crear». Se crea su sistema propio: su base de datos, su sitio y su panel, separados de cualquier otro negocio.
3. **Le llega un enlace.** Es de un solo uso y vale 7 días. Al abrirlo, el dueño crea su acceso (correo y contraseña) y activa un código en su celular (Google Authenticator o similar). El código es obligatorio para todo el equipo.
4. **Configura en el navegador, paso a paso:**
   1. **Su negocio:** nombre, contacto, idioma, moneda e impuesto.
   2. **Su marca:** sube el logo (Altair sugiere colores sacados del logo), elige paleta, diseño de página (Clásico, Inmersivo o Catálogo) y foto principal, y escribe sus textos.
   3. **Qué vende:** transporte, actividades o ambos.
   4. **Sus tarifas,** de una de tres formas:
      - Pasarle su Excel, PDF o foto a su Claude.
      - Descargar la plantilla de Excel, llenarla y subirla.
      - Empezar con datos de ejemplo.

      En los tres casos se crea un **borrador** que el dueño revisa fila por fila y publica.
   5. **Cómo le pagan:** las instrucciones que verá el cliente (SINPE, transferencia…).
   6. **Su Claude:** copia la dirección del conector, la pega en Claude › Configuración › Conectores y aprueba los permisos.
   7. **Publica.** Desde ese momento los clientes pueden reservar.
5. **Suma a su equipo.** Desde «Equipo» invita por correo con un rol (operaciones, finanzas, administración o solo lectura). Cada persona recibe un enlace y activa su propio código.

Nadie instala nada en su computadora, nadie toca código y nadie necesita saber de tecnología.

## Cómo funciona Claude con la suscripción del dueño

- Altair **no usa la API de Anthropic** y **nunca ve la cuenta de Claude** del dueño.
- El dueño agrega su Altair como **conector** en su propio Claude. Al conectar, Claude abre la página de Altair, el dueño entra con su usuario y su código, y elige qué permisos darle.
- Claude piensa con la suscripción del dueño y usa las herramientas de Altair: ver el día, buscar reservas, asignar servicios, cotizar, proponer tarifas y actividades, redactar mensajes y sacar reportes.
- **Reglas:**
  - Las tarifas y actividades que propone Claude quedan como borrador hasta que una persona las publica.
  - Los mensajes quedan redactados hasta que una persona los envía.
  - Claude nunca cobra ni devuelve dinero.
  - Todo lo que hace queda registrado en Panel › Claude, y desde ahí se puede desconectar.

Ejemplos de lo que el dueño le puede decir:

- «¿Qué servicios tengo mañana y cuáles no tienen conductor?»
- «Te paso mi Excel de tarifas 2027: cargalo como borrador.»
- «Asigná el traslado de las 10:00 a Transportes Arenal, conductor Carlos.»
- «Creá una actividad de canopy a las 8 y a las 13, $70 adulto y $50 niño.»
- «Redactá un WhatsApp para MAR-0042 confirmando la hora de recogida.»

## Qué paga cada negocio (para definir)

Cada instancia usa un proyecto de Supabase y uno de Vercel a nombre de Starknot. Para clientes reales hacen falta los planes Pro de ambos, y ese costo entra en la mensualidad de Altair. El plan Hobby de Vercel no permite uso comercial.

## Para la hackathon: lo que normalmente piden

| Pieza | Qué tenemos |
|---|---|
| Logo y banner | Logo de Altair y los posters QR; el banner se puede sacar del lienzo de diseño o del video. |
| Video de demo | El video de Altair ya editado. Conviene sumar una toma corta del flujo real: reservar, ver la reserva en el panel y pedirle algo a Claude. |
| Presentación (pitch) | Se puede armar con este documento y el lienzo de diseño. |
| App en vivo | Falta desplegar en Vercel (`*.vercel.app`) con un proyecto de Supabase de demo. No publicamos nada hasta que lo apruebes. |
| Tecnologías | Next.js 16, React 19, TypeScript, Tailwind v4, Supabase (Postgres, RLS, Auth con TOTP, Storage), servidor MCP y OAuth 2.1 propios para Claude, Vitest, GitHub Actions y Vercel. |
| Repositorio | `github.com/altairbystarknot/...`, a crear y subir cuando lo apruebes. |

Revisá los requisitos exactos en el formulario de la hackathon: cada una pide cosas un poco distintas.
