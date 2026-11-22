// ALL THE COPY OF ALTAIR'S OWN SITE, in Spanish (formal "usted") and English. One module, two
// dictionaries with the same shape. Headlines mark their emphasised words with *asterisks* (rendered as
// <em> by <Rich>); **double asterisks** mark bold. The origin story (the one paragraph that names the
// project Altair comes from) is NOT here: it lives only in app/_components/origin.tsx.

export const LOCALES = ["es", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const isLocale = (v: string | undefined | null): v is Locale => v === "es" || v === "en";

export type PageKey = "home" | "how" | "product" | "claude" | "story" | "request";
const SLUGS: Record<PageKey, string> = {
  home: "",
  how: "/como-funciona",
  product: "/producto",
  claude: "/claude",
  story: "/historia",
  request: "/solicitar",
};
export const href = (locale: Locale, page: PageKey, hash = "") => `/${locale}${SLUGS[page]}${hash}`;

type Item = { t: string; d: string };

const es = {
  meta: {
    title: "Altair by Starknot · Sistema de reservas para turismo",
    description:
      "Sistema de reservas para negocios de turismo: transporte privado y actividades, sitio de reservas con su marca, panel del negocio y su propio Claude conectado.",
    pages: {
      how: { title: "Cómo funciona", description: "De la solicitud a su primera reserva: el proceso completo para tener su Altair, paso a paso." },
      product: { title: "Producto", description: "Sitio de reservas, motores de precios para traslados y actividades, panel del negocio y seguridad." },
      claude: { title: "Altair y Claude", description: "Qué es Claude, cómo se conecta a su negocio con su propia suscripción y qué puede hacer, con límites claros." },
      story: { title: "Nuestra historia", description: "Altair es una iniciativa de Starknot, impulsada por Claude, para simplificar el trabajo de los dueños de negocios de turismo." },
      request: { title: "Solicitar su Altair", description: "Cuéntenos sobre su negocio. Revisamos cada solicitud y le enviamos el enlace para activar su sistema." },
    },
  },
  nav: {
    main: "Principal",
    home: "Inicio",
    homeLabel: "Altair, inicio",
    how: "Cómo funciona",
    product: "Producto",
    claude: "Claude",
    story: "Nuestra historia",
    cta: "Solicitar su Altair",
    menu: "Abrir el menú",
    language: "Idioma",
    skip: "Ir al contenido",
  },
  footer: {
    tagline:
      "Sistema de reservas para negocios de turismo: transporte privado, actividades, panel del negocio y su propio Claude conectado.",
    site: "Altair",
    start: "Empezar",
    faq: "Preguntas frecuentes",
    language: "Idioma",
    by: "Altair by",
    rights: "Starknot. Todos los derechos reservados.",
  },
  common: {
    request: "Solicitar su Altair",
    how: "Cómo funciona",
    example: "Ejemplo",
    sampleNote: "Datos de ejemplo",
    optional: "opcional",
  },
  film: {
    play: "Ver el video",
    length: "58 s",
    label: "Video de presentación de Altair by Starknot",
    note: "Video de presentación · narrado en inglés",
  },
  shots: {
    siteHome: { alt: "Página de inicio del sitio de reservas de un negocio de ejemplo", url: "reservas.su-negocio.com", caption: "Sitio de reservas · inicio" },
    transfer: { alt: "Reserva de un traslado privado con ruta en el mapa y precio por vehículo", url: "reservas.su-negocio.com/traslados", caption: "Traslados · precio final por vehículo" },
    activity: { alt: "Página de una actividad con galería, tarifas y calendario de fechas disponibles", url: "reservas.su-negocio.com/actividades", caption: "Actividades · fechas, horarios y cupos" },
    cart: { alt: "Carrito que combina un traslado y una actividad en una sola reserva", url: "reservas.su-negocio.com/carrito", caption: "Carrito · una sola reserva" },
    panelBookings: { alt: "Panel del negocio con la lista de reservas y su estado", url: "reservas.su-negocio.com/panel/reservas", caption: "Panel · reservas" },
    panelCatalog: { alt: "Panel del negocio con las tarifas de transporte por zona y vehículo", url: "reservas.su-negocio.com/panel/transporte", caption: "Panel · tarifas de transporte" },
  },
  convo: {
    app: "Claude",
    connected: "Conectado a Altair",
    tag: "Ejemplo",
    note: "Conversación de ejemplo con datos ficticios.",
    you: "Usted",
    bookings: {
      ask: "¿Cuántos servicios tengo mañana? ¿Falta asignar alguno?",
      tool: "Altair · resumen_del_dia",
      intro: "Mañana, jueves, tiene **4 servicios**: 3 traslados y 1 actividad. Uno todavía no tiene conductor.",
      cols: ["Hora", "Servicio", "Estado"],
      rows: [
        { time: "06:30", what: "Aeropuerto Liberia → Tamarindo · 4 pax", state: "Sin asignar", warn: true },
        { time: "08:00", what: "Puentes colgantes · 6 pax", state: "Asignado", warn: false },
        { time: "11:45", what: "Tamarindo → Aeropuerto Liberia · 2 pax", state: "Asignado", warn: false },
        { time: "15:10", what: "Aeropuerto Liberia → Playa Flamingo · 5 pax", state: "Asignado", warn: false },
      ],
      close: "¿Quiere que asigne el traslado de las 06:30 a Transportes del Pacífico?",
    },
    draft: {
      ask: "Desde enero, suba a $95 el traslado Aeropuerto Liberia → Tamarindo en van. El regreso también.",
      tools: ["Altair · ver_catalogo", "Altair · proponer_cambios_catalogo"],
      intro: "Listo. Preparé un **borrador** con 2 tarifas para la temporada que empieza en enero. No se publica hasta que usted lo revise.",
      card: {
        state: "Borrador · sin publicar",
        title: "Tarifas desde enero: Liberia ↔ Tamarindo",
        rows: [
          { what: "Aeropuerto Liberia → Tamarindo · Van", price: "$95" },
          { what: "Tamarindo → Aeropuerto Liberia · Van", price: "$95" },
        ],
        action: "Revisar y publicar en el panel",
      },
    },
  },
  story: {
    kicker: "Nuestra historia",
    title: "Construido sobre *operación real.*",
    more: "Leer nuestra historia",
  },
  closing: {
    title: "Su Altair, *listo para vender.*",
    text: "Cuéntenos sobre su negocio. Revisamos cada solicitud y le enviamos el enlace para activar su sistema.",
  },
  home: {
    hero: {
      kicker: "Sistema de reservas para turismo",
      title: "Un sistema de reservas *propio para su negocio de turismo.*",
      lede:
        "Altair reúne lo que una empresa de transporte privado y actividades necesita para vender en línea: un sitio de reservas con su marca, un panel para operar el día a día y una conexión segura con su propio Claude.",
      photoAlt: "Vehículo de transporte privado en una carretera tropical",
      fallbackAlt: "Tucán posado en una rama del bosque tropical de Costa Rica",
      floatKicker: "Un sistema por negocio",
      floatText: "Base de datos, sitio y dominio propios. Su información nunca se comparte con otros negocios.",
    },
    includes: {
      kicker: "Qué incluye",
      title: "Cuatro piezas. *Un solo sistema.*",
      lede: "Todo funciona en conjunto: lo que se publica en el sitio se opera desde el panel y se consulta con Claude.",
      items: [
        { t: "Sitio de reservas", d: "Su página pública, con su logo, sus colores y su dominio, en español e inglés. Sus clientes ven el precio final y reservan en minutos." },
        { t: "Transporte privado y actividades", d: "Traslados por zona y por vehículo; tours con horarios y cupos reales. El servidor calcula cada precio con las reglas que usted define." },
        { t: "Panel del negocio", d: "Reservas, despacho, proveedores, tarifas y pagos en un solo lugar. Cada persona del equipo entra con su rol y un código de dos pasos." },
        { t: "Su Claude, conectado", d: "Consulte reservas, disponibilidad y ventas conversando. Pida cambios de catálogo: Claude los deja como borradores para que una persona los revise y publique." },
      ] as Item[],
    },
    site: {
      kicker: "Para sus clientes",
      title: "Una reserva clara, *de principio a fin.*",
      text:
        "Sus clientes eligen origen y destino —un aeropuerto, un hotel o cualquier dirección— y ven el precio final por vehículo antes de reservar. Las actividades muestran fechas, horarios y cupos disponibles.",
      link: "Ver el producto",
    },
    panel: {
      kicker: "Para su equipo",
      title: "La operación del día, *en una pantalla.*",
      text:
        "Lo pendiente aparece primero: servicios sin asignar, cotizaciones por responder y borradores por revisar. Cada persona ve y cambia solo lo que su rol permite.",
      points: [
        "Despacho de proveedores, conductores y guías.",
        "Tarifas desde Excel, siempre como borrador.",
        "Pagos registrados, sin que el sistema toque su dinero.",
      ],
    },
    claude: {
      kicker: "Altair + Claude",
      title: "Pregunte por su negocio. *Claude responde con sus datos.*",
      text:
        "Claude es el asistente de inteligencia artificial de Anthropic. Altair lo conecta a su negocio a través de su propia suscripción: Claude consulta reservas, disponibilidad y ventas, y prepara cambios que usted aprueba.",
      points: [
        "Usa su propia cuenta de Claude. Altair no llama a ningún modelo de IA.",
        "Los cambios de catálogo quedan como borrador. Nada se publica solo.",
        "Nunca toca dinero, y cada acción queda registrada.",
      ],
      link: "Cómo funciona con Claude",
    },
    film: {
      kicker: "En un minuto",
      title: "Conozca Altair *en 58 segundos.*",
    },
    steps: {
      kicker: "Cómo empezar",
      title: "Cinco pasos, *sin instalar nada.*",
      items: [
        { t: "Solicitud", d: "Complete un formulario breve con los datos de su negocio." },
        { t: "Aprobación", d: "Starknot revisa la solicitud y crea su sistema propio." },
        { t: "Enlace privado", d: "Le enviamos personalmente un enlace de activación de un solo uso." },
        { t: "Configuración", d: "Un asistente guía cada paso: marca, servicios, tarifas, pagos y Claude." },
        { t: "Publicación", d: "Abra su sitio al público cuando esté listo." },
      ] as Item[],
      link: "Ver el proceso completo",
    },
  },
  how: {
    hero: {
      kicker: "Cómo funciona",
      title: "De la solicitud *a su primera reserva.*",
      lede: "Sin instalar programas ni contratar desarrolladores. Este es el proceso completo, paso a paso.",
    },
    steps: [
      {
        t: "Solicite su Altair",
        d: "Complete el formulario con el nombre de su negocio, lo que vende —transporte privado, actividades o ambos— y sus datos de contacto. Toma dos minutos y no tiene costo.",
        meta: "Formulario en línea · Sin costo",
      },
      {
        t: "Starknot aprueba y crea su sistema",
        d: "Revisamos cada solicitud personalmente. Al aprobarla, se crea su instancia: base de datos, sitio y panel propios, separados de cualquier otro negocio.",
        meta: "Un sistema por negocio · Datos aislados",
      },
      {
        t: "Reciba su enlace privado",
        d: "Le enviamos el enlace de activación por correo o WhatsApp. Es de un solo uso y vence en 7 días. Con él crea su cuenta de propietario y activa su código de dos pasos.",
        meta: "Un solo uso · Vence en 7 días",
      },
      {
        t: "Configure su negocio en el navegador",
        d: "Un asistente guía cada paso: datos del negocio, marca, servicios, tarifas, forma de pago y conexión con Claude. Las tarifas se cargan desde Excel, con datos de ejemplo o a través de su Claude, y quedan como borrador hasta que usted las publica.",
        meta: "Negocio · Marca · Servicios · Tarifas · Pagos · Claude",
      },
      {
        t: "Conecte su Claude",
        d: "Copie la dirección del conector desde su panel y agréguela en Claude. Inicie sesión con su cuenta de Altair y elija qué permisos le da. Es opcional y puede desconectarlo cuando quiera.",
        meta: "Opcional · Con su propia suscripción",
      },
      {
        t: "Publique y opere",
        d: "Abra su sitio al público cuando esté listo. Las reservas llegan al panel, donde su equipo asigna proveedores y conductores y registra cada pago. Invite a cada persona con su rol.",
        meta: "Reservas · Despacho · Pagos · Equipo",
      },
    ],
    need: {
      kicker: "Antes de empezar",
      title: "Lo que conviene *tener a mano.*",
      items: [
        { t: "Su logo y algunas fotos", d: "Del negocio, sus vehículos o sus tours. Puede cambiarlas cuando quiera." },
        { t: "Sus tarifas", d: "En Excel, PDF o notas. Si todavía no están ordenadas, puede empezar con datos de ejemplo." },
        { t: "Sus canales de contacto", d: "El WhatsApp y el correo donde sus clientes le escriben y donde quiere recibir avisos." },
        { t: "Sus instrucciones de pago", d: "Transferencia, SINPE, efectivo o enlace de pago, explicadas con sus propias palabras." },
      ] as Item[],
    },
    faq: {
      kicker: "Preguntas frecuentes",
      title: "Lo que más *nos preguntan.*",
      items: [
        { t: "¿Necesito conocimientos técnicos?", d: "No. Todo se configura en el navegador con un asistente paso a paso. Nadie instala nada ni toca código." },
        { t: "¿Quién es dueño de los datos?", d: "Usted. Cada negocio tiene su propio sistema y su propia base de datos; ningún otro negocio comparte su información." },
        { t: "¿Necesito una cuenta de Claude?", d: "Solo si quiere manejar el negocio conversando. Claude se conecta con su propia suscripción; Altair nunca ve su cuenta ni guarda sus credenciales de Claude." },
        { t: "¿Puedo usar mi propio dominio?", d: "Sí. Su sitio puede funcionar en su dominio, por ejemplo reservas.sunegocio.com." },
        { t: "¿Cómo se cobran las reservas?", d: "Hoy, en modo registros: el sistema no procesa dinero. Sus clientes ven sus instrucciones de pago y su equipo registra cada pago en el panel. El cobro con tarjeta mediante Stripe estará disponible próximamente." },
        { t: "¿Qué pasa si un cliente pide un destino fuera de mis zonas?", d: "Puede enviarlo igual: llega como solicitud de cotización y usted responde con el precio. El sistema nunca muestra un precio en cero." },
      ] as Item[],
    },
  },
  product: {
    hero: {
      kicker: "Producto",
      title: "Todo lo que su operación *necesita.*",
      lede:
        "Un sitio de reservas con su marca, dos motores de precios, un panel para el día a día y su Claude conectado. Una sola plataforma, configurada para su negocio.",
    },
    site: {
      kicker: "Sitio de reservas",
      title: "Su marca, *su dominio.*",
      text:
        "Inicio con sus servicios y rutas, página de traslados, catálogo de actividades con filtros, preguntas frecuentes y contacto. Tres diseños de página y paletas a elegir, en español e inglés.",
      points: [
        "Reserva de traslados paso a paso, con mapa.",
        "Página por actividad con galería, tarifas y calendario.",
        "Un carrito para combinar traslados y actividades en una sola reserva.",
        "Código de reserva y comprobante al instante.",
      ],
    },
    cart: {
      title: "Traslados y tours, *en una sola reserva.*",
      text: "El cliente agrega lo que necesita para su viaje y confirma una vez. Usted recibe una reserva con cada servicio listo para asignar.",
    },
    pricing: {
      kicker: "Precios",
      title: "El servidor calcula *cada precio.*",
      text:
        "Usted define las reglas; el sistema las aplica igual en el sitio, en el panel y en Claude. El precio que ve el cliente es el precio de la reserva.",
      engines: [
        {
          t: "Traslados privados",
          items: [
            "Precio por zona de origen y destino, por vehículo y por temporada.",
            "Cualquier hotel o dirección: el mapa la ubica en la zona que la cubre.",
            "Recargos por horario o fecha, y extras como silla de bebé o paradas.",
            "Impuestos incluidos y redondeo a dólares enteros, siempre igual.",
            "Fuera de sus zonas o sin tarifa: se envía como cotización, nunca en cero.",
          ],
        },
        {
          t: "Actividades",
          items: [
            "Horarios por día de la semana, con cupo real por salida.",
            "Precio por adulto y por niño, con edades y bebés sin costo.",
            "Recogida en hotel incluida o con costo según la zona.",
            "Confirmación inmediata o bajo solicitud, según la actividad.",
            "Calendario con las fechas disponibles y los lugares que quedan.",
          ],
        },
      ],
    },
    panel: {
      kicker: "Panel del negocio",
      title: "Del pedido *al conductor.*",
      text: "Cada módulo cumple una función. Lo pendiente aparece primero, y cada persona ve solo lo que su rol permite.",
      modules: [
        { t: "Hoy", d: "Los servicios del día y lo que falta resolver." },
        { t: "Reservas", d: "Buscar, confirmar, cancelar y ver el detalle de cada una." },
        { t: "Despacho", d: "Proveedor, conductor o guía y vehículo de cada servicio." },
        { t: "Proveedores", d: "Transportistas y guías con sus contactos." },
        { t: "Transporte", d: "Zonas, lugares, vehículos, temporadas, recargos y extras." },
        { t: "Actividades", d: "Horarios, cupos, precios y recogida por zona." },
        { t: "Borradores", d: "Cambios de catálogo propuestos, listos para revisar y publicar." },
        { t: "Importar Excel", d: "Sus tarifas desde una hoja de cálculo." },
        { t: "Claude", d: "La conexión con su Claude y el registro de todo lo que hizo." },
        { t: "Sitio y marca", d: "Logo, colores, diseño, textos e idiomas." },
        { t: "Cobros", d: "Pagos registrados e instrucciones para sus clientes." },
        { t: "Equipo", d: "Invitaciones, roles y código de dos pasos." },
      ] as Item[],
    },
    security: {
      kicker: "Seguridad",
      title: "Seguro *desde el diseño.*",
      items: [
        { t: "Un sistema por negocio", d: "Base de datos, sitio y dominio propios. Nada se comparte entre negocios." },
        { t: "Código de dos pasos", d: "Todo el equipo entra con contraseña y un código de una aplicación de autenticación." },
        { t: "Roles", d: "Propietario, administración, operaciones, finanzas y solo lectura: cada persona ve y cambia solo lo suyo." },
        { t: "Registro de cada acción", d: "Cada cambio y cada acción de Claude quedan registrados, con quién y cuándo." },
      ] as Item[],
    },
  },
  claude: {
    hero: {
      kicker: "Altair + Claude",
      title: "Su negocio, *en una conversación.*",
      lede:
        "Altair conecta su propio Claude a su negocio. Pregunte por reservas, disponibilidad o ventas, y pida cambios de catálogo que quedan como borrador hasta que usted los aprueba.",
    },
    what: {
      kicker: "Lo básico",
      title: "¿Qué es *Claude?*",
      paragraphs: [
        "Claude es el asistente de inteligencia artificial creado por Anthropic. Se usa conversando, en la web, en la aplicación de escritorio o en el celular: usted escribe lo que necesita con sus propias palabras y Claude responde.",
        "Por sí solo, Claude no conoce su negocio. Altair le da una conexión segura, llamada conector, para que pueda consultar sus datos y preparar trabajo dentro de los límites que usted define.",
        "Para usarlo necesita su propia suscripción de Claude, con un plan que permita conectores personalizados. Altair no vende ni administra esa suscripción.",
      ],
      facts: [
        { t: "Su suscripción, su cuenta", d: "Claude trabaja con su propia suscripción. Altair nunca llama a un modelo de IA y nunca guarda credenciales de Claude." },
        { t: "Usted decide los permisos", d: "Al conectarlo, elige qué puede hacer Claude. Nunca más de lo que permite su rol." },
        { t: "Todo queda registrado", d: "Cada acción de Claude se guarda en Panel › Claude, desde donde puede desconectarlo." },
      ] as Item[],
    },
    connect: {
      kicker: "La conexión",
      title: "Se conecta *una sola vez.*",
      steps: [
        { t: "Copie la dirección del conector", d: "En su panel, sección Claude. Cada negocio tiene la suya." },
        { t: "Agréguela en Claude", d: "En la configuración de Claude, sección Conectores, agregue un conector personalizado con esa dirección." },
        { t: "Inicie sesión y elija los permisos", d: "Claude abre la página de su Altair. Usted entra con su cuenta y su código de dos pasos, y decide qué puede hacer Claude." },
      ] as Item[],
    },
    scopes: {
      kicker: "Permisos",
      title: "Usted elige *qué puede hacer.*",
      text: "Estos son los cuatro permisos que puede darle a Claude al conectarlo. Cada pedido se verifica en la base de datos con el rol actual de la persona que lo conectó.",
      items: [
        { t: "Ver reservas, operación y catálogo", d: "Consultar reservas, servicios del día, tarifas y reportes." },
        { t: "Asignar servicios y cambiar estados", d: "Asignar proveedor, conductor y vehículo; marcar servicios como realizados." },
        { t: "Proponer cambios de catálogo", d: "Crear borradores de tarifas, zonas, vehículos y actividades. Una persona los publica." },
        { t: "Redactar mensajes a clientes", d: "Dejar borradores de WhatsApp o correo. Una persona los envía." },
      ] as Item[],
    },
    tools: {
      kicker: "Qué puede hacer",
      title: "Pregúntele *con sus palabras.*",
      text: "Estas son las herramientas que Altair le ofrece a su Claude. Cada una abre una sola puerta, verificada en la base de datos.",
      cols: { ask: "Usted pide", does: "Claude hace" },
      groups: [
        {
          title: "Consultar",
          items: [
            { ask: "¿Con qué negocio está conectado?", does: "Confirma el negocio, la fecha de hoy en su zona horaria, quién conectó Claude y sus permisos.", tool: "quien_soy" },
            { ask: "¿Qué servicios tengo mañana?", does: "Servicios del día con hora, cliente, proveedor y estado; lo que falta asignar en los próximos tres días, reservas nuevas, cotizaciones pendientes y borradores por revisar.", tool: "resumen_del_dia" },
            { ask: "Busque la reserva de la familia Rojas.", does: "Reservas por código, nombre, correo, estado o fechas, con su detalle completo e historial.", tool: "buscar_reservas · ver_reserva" },
            { ask: "¿Qué tarifas tengo desde el aeropuerto?", does: "El catálogo actual: zonas, lugares, vehículos, temporadas, tarifas, extras, actividades y proveedores.", tool: "ver_catalogo" },
            { ask: "¿Cuánto cuesta Liberia a Tamarindo para seis personas?", does: "El precio final por vehículo, con las mismas reglas que su sitio.", tool: "cotizar_traslado" },
            { ask: "¿Cuánto vendimos en octubre?", does: "Ventas por fecha de servicio y por tipo, y cotizaciones pendientes.", tool: "reporte_ventas" },
          ],
        },
        {
          title: "Operar",
          items: [
            { ask: "Asigne el traslado de las 10:00 a Carlos.", does: "Proveedor, conductor o guía, vehículo, nota y estado de un servicio. No cambia precios ni cobros.", tool: "asignar_servicio" },
          ],
        },
        {
          title: "Preparar borradores",
          items: [
            { ask: "Cargue mis tarifas 2027 desde este Excel.", does: "Tarifas, zonas, lugares, vehículos, temporadas, extras, actividades o proveedores como borrador. Una persona lo revisa y lo publica en el panel.", tool: "proponer_cambios_catalogo" },
            { ask: "Escriba al cliente la hora de recogida.", does: "Un WhatsApp o correo redactado en la reserva. Una persona lo revisa y lo envía.", tool: "redactar_mensaje" },
          ],
        },
      ],
    },
    draft: {
      kicker: "Ejemplo",
      title: "Claude prepara. *Usted publica.*",
      text:
        "Cuando pide un cambio de precios, rutas o actividades, Claude no lo aplica: crea un borrador. Usted lo revisa fila por fila en el panel y decide si lo publica.",
    },
    limits: {
      kicker: "Límites claros",
      title: "Lo que Claude *nunca hace.*",
      never: [
        "Cobrar, reembolsar o mover dinero.",
        "Publicar tarifas o actividades por su cuenta: deja borradores.",
        "Enviar mensajes a clientes: los deja redactados.",
        "Ver su contraseña o su código de dos pasos.",
        "Ir más allá de su rol: cada pedido se verifica con su rol actual.",
      ],
      promiseTitle: "Lo que Altair garantiza",
      promise: [
        "Altair no llama a ningún modelo de IA ni guarda credenciales de Claude.",
        "Cada acción de Claude queda registrada en su panel.",
        "Puede desconectar a Claude en cualquier momento.",
      ],
    },
  },
  history: {
    hero: {
      kicker: "Nuestra historia",
      title: "Nacido en la operación. *Hecho para nuevos negocios.*",
      lede: "Una iniciativa de Starknot que lleva la experiencia de la operación turística real a cada nuevo negocio.",
      photoAlt: "Paisaje de Costa Rica al atardecer",
      fallbackAlt: "Perezoso colgado de una rama en el bosque de Costa Rica",
    },
    principles: {
      kicker: "Lo que nos guía",
      title: "Tres principios, *desde el primer día.*",
      items: [
        { t: "Cada negocio, su propio sistema", d: "Base de datos, sitio y dominio propios. La información de un negocio nunca se mezcla con la de otro." },
        { t: "Claude, del lado del propietario", d: "La configuración y el día a día pueden hacerse conversando, con la suscripción de Claude de cada propietario." },
        { t: "Precios calculados, no improvisados", d: "El servidor calcula cada precio con las reglas que el propietario aprueba: el mismo precio en el sitio, en el panel y en Claude." },
      ] as Item[],
    },
    next: {
      kicker: "Hacia dónde vamos",
      title: "Más allá de *Costa Rica.*",
      text: "Altair crece con cada negocio que se suma. Hay otros proyectos en desarrollo, no solo en Costa Rica: los primeros comienzan en Estados Unidos.",
      places: [
        { t: "Costa Rica", d: "Proyectos en desarrollo" },
        { t: "Estados Unidos", d: "Los primeros proyectos, en marcha" },
      ] as Item[],
    },
    starknot: {
      kicker: "Quiénes somos",
      title: "Starknot, *arquitectura digital.*",
      text:
        "Starknot es un estudio de software de Costa Rica. Diseñamos y construimos sitios web y los sistemas que los sostienen, para empresas que se toman en serio su operación, con especialidad en transporte turístico.",
      link: "Conocer Starknot",
    },
  },
  request: {
    kicker: "Solicitar su Altair",
    title: "Empecemos *por su negocio.*",
    lede: "Toma dos minutos. Con estos datos preparamos su sistema; el resto lo configura después, a su ritmo.",
    nextTitle: "Qué pasa después",
    next: [
      { t: "Revisamos su solicitud", d: "Starknot la revisa personalmente y le responde por correo o WhatsApp." },
      { t: "Creamos su sistema", d: "Sitio, panel y base de datos propios, solo para su negocio." },
      { t: "Le enviamos su enlace", d: "Un enlace privado, de un solo uso, para activar su cuenta de propietario." },
      { t: "Configura y publica", d: "Un asistente guía cada paso. Usted decide cuándo publicar." },
    ] as Item[],
    form: {
      business: "Su negocio",
      businessName: "Nombre del negocio",
      businessPh: "Ej.: Pacífico Shuttles & Tours",
      country: "País",
      countryPh: "Costa Rica",
      website: "Sitio web o redes sociales",
      websitePh: "instagram.com/sunegocio",
      services: "Qué vende",
      transfers: { t: "Transporte privado", d: "Traslados desde aeropuertos, hoteles y destinos, por vehículo." },
      activities: { t: "Actividades y tours", d: "Salidas con horario, cupos y recogida en hotel." },
      contact: "Contacto",
      name: "Su nombre",
      whatsapp: "WhatsApp",
      whatsappPh: "+506 8888 8888",
      email: "Correo electrónico",
      emailPh: "nombre@sunegocio.com",
      notes: "Cuéntenos sobre su negocio",
      notesPh: "Cuántos vehículos o tours tiene, de dónde vienen sus clientes, qué usa hoy para reservar…",
      submit: "Enviar solicitud",
      sending: "Enviando…",
      privacy: "Usamos estos datos solo para responder a su solicitud.",
    },
    errors: {
      throttled: "Recibimos varias solicitudes desde su conexión. Intente de nuevo más tarde.",
      invalid: "Revise los datos: nombre del negocio, su nombre, un correo válido y al menos un servicio.",
      failed: "No pudimos enviar la solicitud.",
    },
    done: {
      kicker: "Solicitud recibida",
      title: "Gracias. *Recibimos su solicitud.*",
      text:
        "Starknot la revisará personalmente. Cuando la aprobemos, le enviaremos el enlace privado para activar su sistema; desde ahí configura todo en el navegador.",
      next: "Ver cómo sigue",
      home: "Volver al inicio",
    },
  },
  vision: {
    dock: { product: "Producto", claude: "Claude", start: "Empezar" },
    carousel: {
      region: "Pantallas reales de Altair",
      prev: "Pantalla anterior",
      next: "Pantalla siguiente",
      of: "de",
      sample: "Pantallas reales con datos de ejemplo.",
      items: [
        { title: "Sitio de reservas", caption: "Su marca y su dominio, en español e inglés." },
        { title: "Traslados privados", caption: "Ruta en el mapa y precio final por vehículo." },
        { title: "Actividades", caption: "Fechas, horarios y cupos reales." },
        { title: "Una sola reserva", caption: "Traslados y actividades en un solo paso." },
        { title: "Panel · reservas", caption: "Todo lo que entra, con su estado." },
        { title: "Panel · tarifas", caption: "Precios por zona y vehículo, impuestos calculados." },
      ],
    },
    step: "Paso",
    vignettes: {
      sample: "Ilustración con datos de ejemplo",
      form: { title: "Solicitar Altair", business: "Negocio", businessValue: "Su negocio", services: "Servicios", transfers: "Traslados", tours: "Tours", email: "Correo", emailValue: "usted@su-negocio.com", send: "Enviar solicitud" },
      console: { title: "Solicitudes", business: "Su negocio", place: "Costa Rica", approved: "Aprobada", review: "En revisión" },
      link: { title: "Enlace de activación", oneUse: "Un solo uso · personal", url: "su-negocio.altair/activar/•••••", copy: "Copiar", copied: "Copiado" },
      setup: { title: "Configuración", items: ["Marca", "Servicios", "Tarifas", "Pagos", "Claude"] },
      live: { url: "reservas.su-negocio.com", online: "En línea", book: "Reservar", headline: "Traslados y tours" },
    },
  },
  notFound: {
    kicker: "Error 404",
    title: "Esta página *no existe.*",
    text: "Puede que el enlace haya cambiado. Vuelva al inicio o solicite su Altair.",
    home: "Volver al inicio",
  },
};

export type Dict = typeof es;

const en: Dict = {
  meta: {
    title: "Altair by Starknot · Booking system for tourism",
    description:
      "Booking system for tourism businesses: private transport and activities, a booking site under your brand, a business panel and your own Claude connected.",
    pages: {
      how: { title: "How it works", description: "From request to your first booking: the complete process to get your Altair, step by step." },
      product: { title: "Product", description: "Booking site, pricing engines for transfers and activities, business panel and security." },
      claude: { title: "Altair and Claude", description: "What Claude is, how it connects to your business with your own subscription, and what it can do — with clear limits." },
      story: { title: "Our story", description: "Altair is a Starknot initiative, powered by Claude, to make work easier for tourism business owners." },
      request: { title: "Request your Altair", description: "Tell us about your business. We review every request and send you the link to activate your system." },
    },
  },
  nav: {
    main: "Main",
    home: "Home",
    homeLabel: "Altair, home",
    how: "How it works",
    product: "Product",
    claude: "Claude",
    story: "Our story",
    cta: "Request your Altair",
    menu: "Open menu",
    language: "Language",
    skip: "Skip to content",
  },
  footer: {
    tagline:
      "Booking system for tourism businesses: private transport, activities, a business panel and your own Claude connected.",
    site: "Altair",
    start: "Get started",
    faq: "Frequently asked questions",
    language: "Language",
    by: "Altair by",
    rights: "Starknot. All rights reserved.",
  },
  common: {
    request: "Request your Altair",
    how: "How it works",
    example: "Example",
    sampleNote: "Sample data",
    optional: "optional",
  },
  film: {
    play: "Watch the film",
    length: "58 s",
    label: "Altair by Starknot introduction film",
    note: "Introduction film · narrated in English",
  },
  shots: {
    siteHome: { alt: "Home page of the booking site of a sample business", url: "booking.your-business.com", caption: "Booking site · home" },
    transfer: { alt: "Booking a private transfer with the route on a map and the price per vehicle", url: "booking.your-business.com/traslados", caption: "Transfers · final price per vehicle" },
    activity: { alt: "Activity page with gallery, rates and a calendar of available dates", url: "booking.your-business.com/actividades", caption: "Activities · dates, times and spots" },
    cart: { alt: "Cart combining a transfer and an activity in one booking", url: "booking.your-business.com/carrito", caption: "Cart · one booking" },
    panelBookings: { alt: "Business panel with the list of bookings and their status", url: "booking.your-business.com/panel/reservas", caption: "Panel · bookings" },
    panelCatalog: { alt: "Business panel with transport rates by zone and vehicle", url: "booking.your-business.com/panel/transporte", caption: "Panel · transport rates" },
  },
  convo: {
    app: "Claude",
    connected: "Connected to Altair",
    tag: "Example",
    note: "Example conversation with fictional data.",
    you: "You",
    bookings: {
      ask: "How many services do I have tomorrow? Is anything still unassigned?",
      tool: "Altair · resumen_del_dia",
      intro: "Tomorrow, Thursday, you have **4 services**: 3 transfers and 1 activity. One still has no driver.",
      cols: ["Time", "Service", "Status"],
      rows: [
        { time: "06:30", what: "Liberia Airport → Tamarindo · 4 pax", state: "Unassigned", warn: true },
        { time: "08:00", what: "Hanging bridges · 6 pax", state: "Assigned", warn: false },
        { time: "11:45", what: "Tamarindo → Liberia Airport · 2 pax", state: "Assigned", warn: false },
        { time: "15:10", what: "Liberia Airport → Playa Flamingo · 5 pax", state: "Assigned", warn: false },
      ],
      close: "Would you like me to assign the 06:30 transfer to Transportes del Pacífico?",
    },
    draft: {
      ask: "Starting in January, raise the Liberia Airport → Tamarindo van transfer to $95. The return trip too.",
      tools: ["Altair · ver_catalogo", "Altair · proponer_cambios_catalogo"],
      intro: "Done. I prepared a **draft** with 2 rates for the season starting in January. Nothing goes live until you review it.",
      card: {
        state: "Draft · not published",
        title: "Rates from January: Liberia ↔ Tamarindo",
        rows: [
          { what: "Liberia Airport → Tamarindo · Van", price: "$95" },
          { what: "Tamarindo → Liberia Airport · Van", price: "$95" },
        ],
        action: "Review and publish in the panel",
      },
    },
  },
  story: {
    kicker: "Our story",
    title: "Built on *real operations.*",
    more: "Read our story",
  },
  closing: {
    title: "Your Altair, *ready to sell.*",
    text: "Tell us about your business. We review every request and send you the link to activate your system.",
  },
  home: {
    hero: {
      kicker: "Booking system for tourism",
      title: "Your own booking system, *built for your tourism business.*",
      lede:
        "Altair brings together what a private transport and activities company needs to sell online: a booking site under your brand, a panel to run day-to-day operations, and a secure connection to your own Claude.",
      photoAlt: "Private transfer vehicle on a tropical road",
      fallbackAlt: "Toucan perched on a branch in the Costa Rican rainforest",
      floatKicker: "One system per business",
      floatText: "Its own database, site and domain. Your information is never shared with other businesses.",
    },
    includes: {
      kicker: "What's included",
      title: "Four parts. *One system.*",
      lede: "Everything works together: what goes live on the site is run from the panel and can be queried through Claude.",
      items: [
        { t: "Booking site", d: "Your public site with your logo, colors and domain, in Spanish and English. Customers see the final price and book in minutes." },
        { t: "Private transport and activities", d: "Transfers priced by zone and vehicle; tours with real schedules and capacity. The server calculates every price with the rules you set." },
        { t: "Business panel", d: "Bookings, dispatch, suppliers, rates and payments in one place. Every team member signs in with their role and a two-step code." },
        { t: "Your Claude, connected", d: "Ask about bookings, availability and sales in plain words. Request catalog changes: Claude leaves them as drafts for a person to review and publish." },
      ],
    },
    site: {
      kicker: "For your customers",
      title: "A clear booking, *start to finish.*",
      text:
        "Customers choose pickup and drop-off — an airport, a hotel or any address — and see the final price per vehicle before booking. Activities show available dates, times and spots.",
      link: "Explore the product",
    },
    panel: {
      kicker: "For your team",
      title: "The day's operation, *on one screen.*",
      text:
        "What needs attention comes first: unassigned services, quotes to answer and drafts to review. Each person sees and changes only what their role allows.",
      points: [
        "Dispatch suppliers, drivers and guides.",
        "Rates from Excel, always as a draft.",
        "Payments recorded — the system never touches your money.",
      ],
    },
    claude: {
      kicker: "Altair + Claude",
      title: "Ask about your business. *Claude answers with your data.*",
      text:
        "Claude is the AI assistant made by Anthropic. Altair connects it to your business through your own subscription: Claude looks up bookings, availability and sales, and prepares changes for you to approve.",
      points: [
        "It uses your own Claude account. Altair never calls an AI model itself.",
        "Catalog changes stay as drafts. Nothing goes live on its own.",
        "It never touches money, and every action is logged.",
      ],
      link: "How it works with Claude",
    },
    film: {
      kicker: "In one minute",
      title: "Meet Altair *in 58 seconds.*",
    },
    steps: {
      kicker: "Getting started",
      title: "Five steps, *nothing to install.*",
      items: [
        { t: "Request", d: "Fill in a short form with your business details." },
        { t: "Approval", d: "Starknot reviews your request and creates your own system." },
        { t: "Private link", d: "We personally send you a single-use activation link." },
        { t: "Setup", d: "A guided assistant covers each step: brand, services, rates, payments and Claude." },
        { t: "Go live", d: "Open your site to the public when you are ready." },
      ],
      link: "See the full process",
    },
  },
  how: {
    hero: {
      kicker: "How it works",
      title: "From request *to your first booking.*",
      lede: "No software to install and no developers to hire. This is the complete process, step by step.",
    },
    steps: [
      {
        t: "Request your Altair",
        d: "Fill in the form with your business name, what you sell — private transport, activities or both — and your contact details. It takes two minutes and costs nothing.",
        meta: "Online form · Free",
      },
      {
        t: "Starknot approves and creates your system",
        d: "We review every request personally. Once approved, your instance is created: its own database, site and panel, separate from any other business.",
        meta: "One system per business · Isolated data",
      },
      {
        t: "Receive your private link",
        d: "We send you the activation link by email or WhatsApp. It works once and expires in 7 days. With it you create your owner account and turn on your two-step code.",
        meta: "Single use · Expires in 7 days",
      },
      {
        t: "Set up your business in the browser",
        d: "A guided assistant covers each step: business details, brand, services, rates, payment method and the Claude connection. Rates come from Excel, sample data or your Claude, and stay as a draft until you publish them.",
        meta: "Business · Brand · Services · Rates · Payments · Claude",
      },
      {
        t: "Connect your Claude",
        d: "Copy the connector address from your panel and add it in Claude. Sign in with your Altair account and choose which permissions to grant. It is optional and you can disconnect it at any time.",
        meta: "Optional · With your own subscription",
      },
      {
        t: "Go live and operate",
        d: "Open your site to the public when you are ready. Bookings arrive in the panel, where your team assigns suppliers and drivers and records every payment. Invite each person with their role.",
        meta: "Bookings · Dispatch · Payments · Team",
      },
    ],
    need: {
      kicker: "Before you start",
      title: "Good to *have at hand.*",
      items: [
        { t: "Your logo and a few photos", d: "Of the business, your vehicles or your tours. You can change them at any time." },
        { t: "Your rates", d: "In Excel, PDF or notes. If they are not organized yet, you can start with sample data." },
        { t: "Your contact channels", d: "The WhatsApp and email where customers reach you and where you want to receive notices." },
        { t: "Your payment instructions", d: "Bank transfer, SINPE, cash or a payment link, explained in your own words." },
      ],
    },
    faq: {
      kicker: "Frequently asked questions",
      title: "What people *ask us most.*",
      items: [
        { t: "Do I need technical knowledge?", d: "No. Everything is set up in the browser with a step-by-step assistant. Nobody installs anything or touches code." },
        { t: "Who owns the data?", d: "You do. Each business has its own system and its own database; no other business shares your information." },
        { t: "Do I need a Claude account?", d: "Only if you want to run the business by conversation. Claude connects with your own subscription; Altair never sees your account or stores your Claude credentials." },
        { t: "Can I use my own domain?", d: "Yes. Your site can run on your domain, for example booking.yourbusiness.com." },
        { t: "How are bookings paid?", d: "Today, in records mode: the system does not process money. Customers see your payment instructions and your team records each payment in the panel. Card payments through Stripe are coming soon." },
        { t: "What if a customer asks for a place outside my zones?", d: "They can still send it: it arrives as a quote request and you reply with the price. The system never shows a price of zero." },
      ],
    },
  },
  product: {
    hero: {
      kicker: "Product",
      title: "Everything your operation *needs.*",
      lede:
        "A booking site under your brand, two pricing engines, a panel for day-to-day work and your Claude connected. One platform, configured for your business.",
    },
    site: {
      kicker: "Booking site",
      title: "Your brand, *your domain.*",
      text:
        "A home page with your services and routes, a transfers page, an activities catalog with filters, FAQs and contact. Three page designs and palettes to choose from, in Spanish and English.",
      points: [
        "Step-by-step transfer booking, with a map.",
        "A page per activity with gallery, rates and calendar.",
        "One cart to combine transfers and activities in a single booking.",
        "Booking code and confirmation instantly.",
      ],
    },
    cart: {
      title: "Transfers and tours, *in one booking.*",
      text: "Customers add what they need for their trip and confirm once. You receive one booking with every service ready to assign.",
    },
    pricing: {
      kicker: "Pricing",
      title: "The server calculates *every price.*",
      text:
        "You set the rules; the system applies them the same way on the site, in the panel and in Claude. The price the customer sees is the price of the booking.",
      engines: [
        {
          t: "Private transfers",
          items: [
            "Price by pickup and drop-off zone, by vehicle and by season.",
            "Any hotel or address: the map places it in the zone that covers it.",
            "Surcharges by time or date, and extras like child seats or stops.",
            "Taxes included and rounded to whole dollars, always the same way.",
            "Outside your zones or without a rate: sent as a quote, never at zero.",
          ],
        },
        {
          t: "Activities",
          items: [
            "Schedules by weekday, with real capacity per departure.",
            "Adult and child prices, with age ranges and free infants.",
            "Hotel pickup included or priced by zone.",
            "Instant confirmation or on request, per activity.",
            "A calendar with available dates and remaining spots.",
          ],
        },
      ],
    },
    panel: {
      kicker: "Business panel",
      title: "From request *to driver.*",
      text: "Each module has one job. What needs attention comes first, and each person sees only what their role allows.",
      modules: [
        { t: "Today", d: "The day's services and what is still open." },
        { t: "Bookings", d: "Search, confirm, cancel and see the detail of each one." },
        { t: "Dispatch", d: "Supplier, driver or guide and vehicle for each service." },
        { t: "Suppliers", d: "Transport companies and guides with their contacts." },
        { t: "Transport", d: "Zones, places, vehicles, seasons, surcharges and extras." },
        { t: "Activities", d: "Schedules, capacity, prices and pickup by zone." },
        { t: "Drafts", d: "Proposed catalog changes, ready to review and publish." },
        { t: "Excel import", d: "Your rates from a spreadsheet." },
        { t: "Claude", d: "The connection to your Claude and a log of everything it did." },
        { t: "Site and brand", d: "Logo, colors, design, copy and languages." },
        { t: "Payments", d: "Recorded payments and instructions for your customers." },
        { t: "Team", d: "Invitations, roles and two-step codes." },
      ],
    },
    security: {
      kicker: "Security",
      title: "Secure *by design.*",
      items: [
        { t: "One system per business", d: "Its own database, site and domain. Nothing is shared between businesses." },
        { t: "Two-step code", d: "The whole team signs in with a password and a code from an authenticator app." },
        { t: "Roles", d: "Owner, admin, operations, finance and read-only: each person sees and changes only their part." },
        { t: "Every action logged", d: "Every change and every Claude action is recorded, with who and when." },
      ],
    },
  },
  claude: {
    hero: {
      kicker: "Altair + Claude",
      title: "Your business, *in a conversation.*",
      lede:
        "Altair connects your own Claude to your business. Ask about bookings, availability or sales, and request catalog changes that stay as drafts until you approve them.",
    },
    what: {
      kicker: "The basics",
      title: "What is *Claude?*",
      paragraphs: [
        "Claude is the AI assistant made by Anthropic. You talk to it on the web, in the desktop app or on your phone: you write what you need in your own words and Claude answers.",
        "On its own, Claude does not know your business. Altair gives it a secure connection, called a connector, so it can look up your data and prepare work within the limits you set.",
        "To use it you need your own Claude subscription, on a plan that allows custom connectors. Altair does not sell or manage that subscription.",
      ],
      facts: [
        { t: "Your subscription, your account", d: "Claude works with your own subscription. Altair never calls an AI model and never stores Claude credentials." },
        { t: "You choose the permissions", d: "When you connect it, you choose what Claude may do. Never more than your role allows." },
        { t: "Everything is logged", d: "Every Claude action is saved in Panel › Claude, where you can also disconnect it." },
      ],
    },
    connect: {
      kicker: "The connection",
      title: "Connect it *once.*",
      steps: [
        { t: "Copy the connector address", d: "In your panel, under Claude. Each business has its own." },
        { t: "Add it in Claude", d: "In Claude's settings, under Connectors, add a custom connector with that address." },
        { t: "Sign in and choose permissions", d: "Claude opens your Altair sign-in page. You enter with your account and two-step code, and decide what Claude may do." },
      ],
    },
    scopes: {
      kicker: "Permissions",
      title: "You choose *what it can do.*",
      text: "These are the four permissions you can grant Claude when you connect it. Every request is checked in the database against the current role of the person who connected it.",
      items: [
        { t: "View bookings, operations and catalog", d: "Read bookings, the day's services, rates and reports." },
        { t: "Assign services and change statuses", d: "Assign supplier, driver and vehicle; mark services as done." },
        { t: "Propose catalog changes", d: "Create drafts of rates, zones, vehicles and activities. A person publishes them." },
        { t: "Draft messages to customers", d: "Leave WhatsApp or email drafts. A person sends them." },
      ],
    },
    tools: {
      kicker: "What it can do",
      title: "Ask it *in your own words.*",
      text: "These are the tools Altair offers your Claude. Each one opens a single door, checked in the database.",
      cols: { ask: "You ask", does: "Claude does" },
      groups: [
        {
          title: "Look up",
          items: [
            { ask: "Which business are you connected to?", does: "Confirms the business, today's date in its time zone, who connected Claude and their permissions.", tool: "quien_soy" },
            { ask: "What services do I have tomorrow?", does: "The day's services with time, customer, supplier and status; what is unassigned over the next three days, new bookings, pending quotes and drafts to review.", tool: "resumen_del_dia" },
            { ask: "Find the Rojas family's booking.", does: "Bookings by code, name, email, status or dates, with full detail and history.", tool: "buscar_reservas · ver_reserva" },
            { ask: "What rates do I have from the airport?", does: "The current catalog: zones, places, vehicles, seasons, rates, extras, activities and suppliers.", tool: "ver_catalogo" },
            { ask: "How much is Liberia to Tamarindo for six people?", does: "The final price per vehicle, with the same rules as your site.", tool: "cotizar_traslado" },
            { ask: "How much did we sell in October?", does: "Sales by service date and by type, plus pending quotes.", tool: "reporte_ventas" },
          ],
        },
        {
          title: "Operate",
          items: [
            { ask: "Assign the 10:00 transfer to Carlos.", does: "Supplier, driver or guide, vehicle, note and status of one service. It does not change prices or payments.", tool: "asignar_servicio" },
          ],
        },
        {
          title: "Prepare drafts",
          items: [
            { ask: "Load my 2027 rates from this Excel file.", does: "Rates, zones, places, vehicles, seasons, extras, activities or suppliers as a draft. A person reviews it and publishes it in the panel.", tool: "proponer_cambios_catalogo" },
            { ask: "Write the customer their pickup time.", does: "A WhatsApp or email drafted on the booking. A person reviews and sends it.", tool: "redactar_mensaje" },
          ],
        },
      ],
    },
    draft: {
      kicker: "Example",
      title: "Claude prepares. *You publish.*",
      text:
        "When you ask for a change to prices, routes or activities, Claude does not apply it: it creates a draft. You review it row by row in the panel and decide whether to publish.",
    },
    limits: {
      kicker: "Clear limits",
      title: "What Claude *never does.*",
      never: [
        "Charge, refund or move money.",
        "Publish rates or activities on its own: it leaves drafts.",
        "Send messages to customers: it leaves them drafted.",
        "See your password or your two-step code.",
        "Go beyond your role: every request is checked against your current role.",
      ],
      promiseTitle: "What Altair guarantees",
      promise: [
        "Altair never calls an AI model and never stores Claude credentials.",
        "Every Claude action is logged in your panel.",
        "You can disconnect Claude at any time.",
      ],
    },
  },
  history: {
    hero: {
      kicker: "Our story",
      title: "Born in real operations. *Built for new businesses.*",
      lede: "A Starknot initiative that brings the experience of real tourism operations to every new business.",
      photoAlt: "Costa Rican landscape at sunset",
      fallbackAlt: "Sloth hanging from a branch in the Costa Rican forest",
    },
    principles: {
      kicker: "What guides us",
      title: "Three principles, *from day one.*",
      items: [
        { t: "Every business, its own system", d: "Its own database, site and domain. One business's information never mixes with another's." },
        { t: "Claude, on the owner's side", d: "Setup and daily work can be done by conversation, with each owner's own Claude subscription." },
        { t: "Prices calculated, not improvised", d: "The server calculates every price with the rules the owner approves: the same price on the site, in the panel and in Claude." },
      ],
    },
    next: {
      kicker: "Where we are going",
      title: "Beyond *Costa Rica.*",
      text: "Altair grows with every business that joins. Other projects are in development, not only in Costa Rica: the first ones are starting in the United States.",
      places: [
        { t: "Costa Rica", d: "Projects in development" },
        { t: "United States", d: "The first projects, under way" },
      ],
    },
    starknot: {
      kicker: "Who we are",
      title: "Starknot, *digital architecture.*",
      text:
        "Starknot is a software studio from Costa Rica. We design and build websites and the systems behind them for companies that take their operations seriously, with a specialty in tourism transport.",
      link: "Visit Starknot",
    },
  },
  request: {
    kicker: "Request your Altair",
    title: "Let's start *with your business.*",
    lede: "It takes two minutes. We use these details to prepare your system; everything else you set up later, at your own pace.",
    nextTitle: "What happens next",
    next: [
      { t: "We review your request", d: "Starknot reviews it personally and replies by email or WhatsApp." },
      { t: "We create your system", d: "Its own site, panel and database, just for your business." },
      { t: "We send you your link", d: "A private, single-use link to activate your owner account." },
      { t: "You set up and go live", d: "A guided assistant covers each step. You decide when to publish." },
    ],
    form: {
      business: "Your business",
      businessName: "Business name",
      businessPh: "e.g. Pacific Shuttles & Tours",
      country: "Country",
      countryPh: "United States",
      website: "Website or social media",
      websitePh: "instagram.com/yourbusiness",
      services: "What you sell",
      transfers: { t: "Private transport", d: "Transfers from airports, hotels and destinations, by vehicle." },
      activities: { t: "Activities and tours", d: "Scheduled departures with capacity and hotel pickup." },
      contact: "Contact",
      name: "Your name",
      whatsapp: "WhatsApp",
      whatsappPh: "+1 555 123 4567",
      email: "Email",
      emailPh: "name@yourbusiness.com",
      notes: "Tell us about your business",
      notesPh: "How many vehicles or tours you have, where your customers come from, what you use today to take bookings…",
      submit: "Send request",
      sending: "Sending…",
      privacy: "We use these details only to answer your request.",
    },
    errors: {
      throttled: "We received several requests from your connection. Please try again later.",
      invalid: "Please check the details: business name, your name, a valid email and at least one service.",
      failed: "We could not send the request.",
    },
    done: {
      kicker: "Request received",
      title: "Thank you. *We received your request.*",
      text:
        "Starknot will review it personally. Once approved, we will send you the private link to activate your system; from there you set everything up in the browser.",
      next: "See what happens next",
      home: "Back to home",
    },
  },
  vision: {
    dock: { product: "Product", claude: "Claude", start: "Get started" },
    carousel: {
      region: "Real Altair screens",
      prev: "Previous screen",
      next: "Next screen",
      of: "of",
      sample: "Real screens with sample data.",
      items: [
        { title: "Booking site", caption: "Your brand and your domain, in Spanish and English." },
        { title: "Private transfers", caption: "Route on the map and the final price per vehicle." },
        { title: "Activities", caption: "Real dates, times and spots." },
        { title: "One booking", caption: "Transfers and activities in a single step." },
        { title: "Panel · bookings", caption: "Everything that comes in, with its status." },
        { title: "Panel · rates", caption: "Prices by zone and vehicle, taxes worked out." },
      ],
    },
    step: "Step",
    vignettes: {
      sample: "Illustration with sample data",
      form: { title: "Request Altair", business: "Business", businessValue: "Your business", services: "Services", transfers: "Transfers", tours: "Tours", email: "Email", emailValue: "you@your-business.com", send: "Send request" },
      console: { title: "Requests", business: "Your business", place: "Costa Rica", approved: "Approved", review: "In review" },
      link: { title: "Activation link", oneUse: "Single use · personal", url: "your-business.altair/activate/•••••", copy: "Copy", copied: "Copied" },
      setup: { title: "Setup", items: ["Brand", "Services", "Rates", "Payments", "Claude"] },
      live: { url: "booking.your-business.com", online: "Online", book: "Book", headline: "Transfers and tours" },
    },
  },
  notFound: {
    kicker: "Error 404",
    title: "This page *does not exist.*",
    text: "The link may have changed. Go back to the home page or request your Altair.",
    home: "Back to home",
  },
};

const DICTS: Record<Locale, Dict> = { es, en };
export const dict = (locale: Locale): Dict => DICTS[locale];
