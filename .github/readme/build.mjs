// Builds the animated SVGs of the repository README (.github/readme/*.svg) in Altair's light visual language:
// warm white, navy ink, the star's gold, Instrument Serif italics over Inter. Everything is self-contained (fonts
// and the logo outline are embedded), because GitHub shows an SVG as an image and an image cannot load anything
// from outside. Motion is CSS only and stops under prefers-reduced-motion. Sample data is labelled as such.
//
//   node .github/readme/build.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const src = (f) => path.join(dir, "src", f);
const b64 = (f) => fs.readFileSync(src(f)).toString("base64");
const out = (f, svg) => { fs.writeFileSync(path.join(dir, f), svg.replace(/\n\s*/g, "\n")); console.log(`${f}  ${(fs.statSync(path.join(dir, f)).size / 1024).toFixed(1)} KB`); };
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

const C = { navy: "#002b42", abyss: "#00121d", ink: "#0e2a38", text: "#405966", soft: "#7b8f98", gold: "#dcb872", goldDark: "#9c7535", sand: "#ead3a3", sky: "#9fbcc2", bg: "#fbfaf8", line: "rgba(0,43,66,.09)", green: "#2fa85a" };
const SANS = "Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";
const MONO = "ui-monospace,SFMono-Regular,Consolas,'Liberation Mono',monospace";
const SERIF = `@font-face{font-family:IS;src:url(data:font/woff2;base64,${b64("instrument-serif.woff2")}) format('woff2')}
@font-face{font-family:ISI;src:url(data:font/woff2;base64,${b64("instrument-serif-italic.woff2")}) format('woff2')}`;
const INTER = `@font-face{font-family:Inter;font-weight:100 900;src:url(data:font/woff2;base64,${b64("inter.woff2")}) format('woff2')}`;
const LETTERS = fs.readFileSync(src("logo-letters.txt"), "utf8").trim();
const STAR = "M12 0Q13.3 10.7 24 12Q13.3 13.3 12 24Q10.7 13.3 0 12Q10.7 10.7 12 0Z";

const BASE_CSS = `
.rise{animation:rise .9s cubic-bezier(.2,.8,.2,1) both}
@keyframes rise{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
.fade{animation:fade .7s ease both}@keyframes fade{from{opacity:0}to{opacity:1}}
.float{animation:float 7s ease-in-out infinite}@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
.twinkle{transform-box:fill-box;transform-origin:center;animation:twinkle 5s ease-in-out infinite}
@keyframes twinkle{0%,100%{transform:scale(1) rotate(0)}45%{transform:scale(1.12) rotate(45deg)}55%{transform:scale(1.12) rotate(45deg)}}
.draw{stroke-dasharray:1;animation:draw 1.6s ease both}@keyframes draw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}
.sweep{animation:sweep 9s ease-in-out infinite}@keyframes sweep{0%{transform:translateX(-500px)}60%,100%{transform:translateX(1500px)}}
.dot{animation:dot 2.4s ease-in-out infinite}@keyframes dot{0%,100%{opacity:.35}50%{opacity:1}}
.pulse{transform-box:fill-box;transform-origin:center;animation:pulse 2.2s ease-out infinite}@keyframes pulse{0%{transform:scale(.6);opacity:.6}100%{transform:scale(2.2);opacity:0}}`;
const REDUCED = `@media (prefers-reduced-motion:reduce){.rise,.fade,.draw{animation:none;opacity:1;stroke-dashoffset:0}.float,.twinkle,.sweep,.dot,.pulse{animation:none}.pulse{opacity:0}}`;
const d = (s) => `style="animation-delay:${s.toFixed(2)}s"`;
const BG = (w, h) => `<linearGradient id="shine" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<radialGradient id="g1" cx=".12" cy=".05" r=".55"><stop offset="0" stop-color="${C.sand}" stop-opacity=".55"/><stop offset="1" stop-color="${C.sand}" stop-opacity="0"/></radialGradient>
<radialGradient id="g2" cx=".95" cy=".95" r=".6"><stop offset="0" stop-color="${C.sky}" stop-opacity=".45"/><stop offset="1" stop-color="${C.sky}" stop-opacity="0"/></radialGradient>
<pattern id="dots" width="26" height="26" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r="1.1" fill="${C.navy}" fill-opacity=".07"/></pattern>
<clipPath id="frame"><rect width="${w}" height="${h}" rx="28"/></clipPath>
<filter id="sh" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#00203a" flood-opacity=".14"/></filter>`;
const PANEL = (w, h) => `<rect width="${w}" height="${h}" fill="${C.bg}"/><rect width="${w}" height="${h}" fill="url(#g1)"/><rect width="${w}" height="${h}" fill="url(#g2)"/><rect width="${w}" height="${h}" fill="url(#dots)"/>`;
const EDGE = (w, h) => `<rect x=".5" y=".5" width="${w - 1}" height="${h - 1}" rx="28" fill="none" stroke="${C.navy}" stroke-opacity=".08"/>`;
const card = (x, y, w, h, r = 22) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="#fff" stroke="${C.navy}" stroke-opacity=".07" filter="url(#sh)"/>`;
const t = (x, y, s, style, extra = "") => `<text x="${x}" y="${y}" ${extra} style="${style}">${esc(s)}</text>`;
const sans = (size, weight = 500, fill = C.text, more = "") => `font:${weight} ${size}px ${SANS};fill:${fill};${more}`;
const logo = (x, y, h, cls = "") => { const k = h / 846; const cx = 1804.69, cy = 315;
  return `<g transform="translate(${x} ${y}) scale(${k.toFixed(5)}) translate(-135 -130)"><path fill="${C.navy}" d="${LETTERS}"/><g transform="translate(1619.69 130) scale(15.416667)"><path class="twinkle ${cls}" fill="${C.gold}" d="${STAR}"/></g></g>`; };
const check = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><circle r="13" fill="${C.green}"/><path d="M-5.5 0.5l3.6 3.6L6 -4" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></g>`;
const svg = (w, h, label, title, body, fonts = SERIF) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${esc(label)}">
<title>${esc(title)}</title><defs>${BG(w, h)}</defs>
<style>${fonts}${BASE_CSS}${REDUCED}</style>
<g clip-path="url(#frame)">${PANEL(w, h)}${body}<rect class="sweep" x="0" y="0" width="360" height="${h}" fill="url(#shine)" opacity=".5"/></g>${EDGE(w, h)}</svg>`;

// ------------------------------------------------------------------ banner
{ const W = 1280, H = 560;
  const chips = ["Private transfers", "Tours & activities", "Team panel", "Claude connector · MCP"];
  let cx = 80; const chipSvg = chips.map((c, i) => { const w = 22 + c.length * 8.6; const g = `<g class="rise" ${d(1.0 + i * .1)}><rect x="${cx}" y="452" width="${w}" height="36" rx="18" fill="#fff" stroke="${C.navy}" stroke-opacity=".1"/>${t(cx + w / 2, 475, c, sans(14, 600, C.ink), 'text-anchor="middle"')}</g>`; cx += w + 10; return g; }).join("");
  const body = `
<g class="rise" ${d(.1)}>${t(82, 92, "BOOKING SYSTEM FOR TOURISM BUSINESSES", sans(13, 700, C.soft, "letter-spacing:2.4px"))}</g>
<g class="rise" ${d(.2)}>${logo(78, 118, 112)}</g>
<g class="rise" ${d(.45)}>${t(82, 314, "The booking system for tourism,", sans(40, 680, C.navy, "letter-spacing:-1.2px"))}</g>
<g class="rise" ${d(.6)}>${t(80, 372, "run from your own Claude.", `font-family:ISI,Georgia,serif;font-style:italic;font-size:54px;fill:${C.goldDark}`)}</g>
<g class="rise" ${d(.8)}>${t(82, 418, "El sistema de reservas para turismo, operado desde su propio Claude.", sans(17, 500, C.soft))}</g>
${chipSvg}
<g class="float"><g class="rise" ${d(.7)}>${card(800, 70, 400, 170)}
 ${t(828, 108, "PRIVATE TRANSFER", sans(11, 700, C.soft, "letter-spacing:2px"))}
 ${t(828, 140, "SJO airport → La Fortuna", sans(22, 680, C.navy))}
 ${t(828, 168, "Van · up to 8 · 3 travelers", sans(15, 500, C.text))}
 <path class="draw" pathLength="1" ${d(1.4)} d="M832 206 C 900 180, 950 226, 1020 200" fill="none" stroke="${C.navy}" stroke-width="3" stroke-linecap="round"/>
 <circle cx="832" cy="206" r="5" fill="${C.navy}"/><circle cx="1020" cy="200" r="5" fill="${C.gold}"/>
 ${t(1172, 214, "$221", sans(40, 760, C.navy, "letter-spacing:-1.5px"), 'text-anchor="end"')}
 ${t(1172, 108, "price at once", sans(12, 600, C.green), 'text-anchor="end"')}</g></g>
<g class="float" style="animation-delay:-2.3s"><g class="rise" ${d(1.0)}>${card(740, 262, 440, 168)}
 <rect x="764" y="284" width="26" height="26" rx="8" fill="#d97757"/><path d="M777 290v14M770 297h14M772 292l10 10M782 292l-10 10" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>
 ${t(800, 303, "Claude", sans(16, 700, C.navy))}${t(1156, 303, "Altair · Costa Brisa (demo)", sans(12, 600, C.green), 'text-anchor="end"')}
 <rect x="938" y="320" width="218" height="34" rx="17" fill="${C.navy}"/>${t(1047, 342, "What's on for tomorrow?", sans(14, 600, "#fff"), 'text-anchor="middle"')}
 <rect x="764" y="364" width="392" height="50" rx="14" fill="#f3f6f7"/>
 ${t(778, 384, "Tomorrow · 2 services", sans(13, 700, C.navy))}${t(778, 404, "08:30 La Fortuna → Santa Elena · 14:00 LIR → Tamarindo", sans(12, 500, C.text))}</g></g>
<g class="float" style="animation-delay:-4.6s"><g class="rise" ${d(1.3)}>${card(860, 452, 320, 70, 35)}
 <circle cx="896" cy="487" r="18" fill="${C.navy}"/><circle class="pulse" cx="896" cy="487" r="18" fill="none" stroke="${C.gold}" stroke-width="2"/>
 <path d="M889 491v-6a7 7 0 0 1 14 0v6l2 2h-18z" fill="none" stroke="${C.gold}" stroke-width="1.8" stroke-linejoin="round"/>
 ${t(926, 482, "New booking · CBR-0005", sans(15, 700, C.navy))}${t(926, 502, "Sample data · just booked", sans(12, 500, C.soft))}</g></g>`;
  out("banner.svg", svg(W, H, "Altair by Starknot: the booking system for tourism businesses, run from your own Claude. El sistema de reservas para turismo, operado desde su propio Claude.", "Altair by Starknot", body, SERIF + INTER));
}

// ------------------------------------------------------------------ what's inside (four cards)
{ const W = 1280, H = 680;
  const GLYPH = {
    site: `<rect x="-14" y="-11" width="28" height="22" rx="4"/><path d="M-14 -4h28M-9 -7.5h.01M-5 -7.5h.01"/>`,
    engine: `<path d="M-13 9c7 0 4-9 11-9s5-8 9-8" stroke-dasharray="2.5 3.5"/><circle cx="-13" cy="9" r="2.6" fill="currentColor" stroke="none"/><path d="M9 -15a5 5 0 0 1 5 5c0 3.6-5 8-5 8s-5-4.4-5-8a5 5 0 0 1 5-5z"/>`,
    panel: `<rect x="-14" y="-12" width="28" height="24" rx="4"/><path d="M-6 -12v24M-2 -5h12M-2 1h12M-2 7h8"/>`,
    claude: `<path d="M0 -14v28M-14 0h28M-10 -10l20 20M10 -10l-20 20"/>`,
  };
  const S = [
    { n: "01", g: "site", title: "Its own booking site", en: ["Each business gets its brand and its domain,", "in Spanish and English, with prices at once."], es: "Sitio propio, con su marca, en español e inglés.", foot: "ALTAIR-DEMO.VERCEL.APP" },
    { n: "02", g: "engine", title: "Two pricing engines", en: ["Transfers by zone, vehicle and season.", "Tours by date, time and real seats."], es: "Traslados por zona y vehículo; tours con cupos reales.", foot: "THE SERVER RECALCULATES EVERY PRICE" },
    { n: "03", g: "panel", title: "One panel for the team", en: ["Bookings, dispatch, suppliers, rates,", "payments and roles. Rates from Excel."], es: "Reservas, despacho, tarifas, cobros y equipo.", foot: "TWO-STEP SIGN-IN FOR EVERYONE" },
    { n: "04", g: "claude", title: "Run it from your own Claude", en: ["A secure MCP connector: Claude reads, quotes", "and drafts. A person approves. Never money."], es: "Claude consulta y prepara borradores; usted aprueba.", foot: "OAUTH 2.1 · NO AI API CALLS FROM ALTAIR" },
  ];
  const cardSvg = (s, i) => { const x = i % 2 ? 660 : 40, y = i < 2 ? 40 : 360, dl = .15 + i * .2;
    return `<g class="rise" ${d(dl)}>${card(x, y, 580, 290)}
<circle cx="${x + 64}" cy="${y + 66}" r="30" fill="${C.navy}"/>
<g transform="translate(${x + 64} ${y + 66})" fill="none" stroke="${C.gold}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" color="${C.gold}"><g class="float">${GLYPH[s.g]}</g></g>
${t(x + 540, y + 78, s.n, `font-family:ISI,Georgia,serif;font-style:italic;font-size:34px;fill:${C.goldDark}`, 'text-anchor="end"')}
${t(x + 36, y + 146, s.title, `font-family:IS,Georgia,serif;font-size:36px;fill:${C.navy}`)}
<path class="draw" pathLength="1" ${d(dl + .5)} d="M${x + 36} ${y + 162} H ${x + 196}" stroke="${C.gold}" stroke-width="1.4"/>
${t(x + 36, y + 196, s.en[0], sans(18, 500, C.ink))}${t(x + 36, y + 222, s.en[1], sans(18, 500, C.ink))}
${t(x + 36, y + 250, s.es, sans(15, 500, C.soft))}
${t(x + 36, y + 274, s.foot, sans(11.5, 700, C.goldDark, "letter-spacing:1.8px"))}</g>`; };
  out("features.svg", svg(W, H, "What Altair includes: its own booking site, two pricing engines, one panel for the team, and a connector to run it from your own Claude.", "What is inside Altair", S.map(cardSvg).join("\n")));
}

// ------------------------------------------------------------------ Claude conversation
{ const W = 1280, H = 640;
  const tools = ["resumen_del_dia", "buscar_reservas", "ver_reserva", "cotizar_traslado", "asignar_servicio", "redactar_mensaje", "reporte_ventas", "ver_catalogo", "proponer_cambios_catalogo"];
  const body = `
<g class="rise" ${d(.1)}>${card(40, 40, 800, 560, 26)}
 <rect x="68" y="66" width="28" height="28" rx="8" fill="#d97757"/><path d="M82 72v16M74 80h16M76.5 74.5l11 11M87.5 74.5l-11 11" stroke="#fff" stroke-width="1.9" stroke-linecap="round"/>
 ${t(108, 87, "Claude", sans(19, 700, C.navy))}
 <rect x="560" y="64" width="252" height="32" rx="16" fill="#eef6f0"/><circle cx="580" cy="80" r="5" fill="${C.green}"/>${t(594, 85, "Altair · Costa Brisa (demo)", sans(13, 650, "#24414c"))}
 <path d="M40 116 H 840" stroke="${C.navy}" stroke-opacity=".07"/></g>
<g class="rise" ${d(.8)}><rect x="566" y="138" width="246" height="44" rx="22" fill="${C.navy}"/>${t(689, 166, "What's on for tomorrow?", sans(16, 600, "#fff"), 'text-anchor="middle"')}</g>
<g class="rise" ${d(1.4)}><rect x="68" y="196" width="230" height="28" rx="14" fill="#eef2f4"/>${t(82, 215, "altair · resumen_del_dia", `font:500 13px ${MONO};fill:#24414c`)}</g>
<g class="rise" ${d(1.9)}><rect x="68" y="234" width="560" height="128" rx="18" fill="#f3f6f7"/>
 ${t(88, 262, "Tomorrow, Monday Nov 23 · 2 services", sans(16, 700, C.navy))}
 <rect x="84" y="276" width="528" height="34" rx="10" fill="#fff"/>${t(98, 298, "08:30", sans(14, 750, C.navy))}${t(150, 298, "La Fortuna → Santa Elena", sans(14, 500, C.ink))}${t(598, 298, "Sedan · CBR-0006", sans(12.5, 600, C.soft), 'text-anchor="end"')}
 <rect x="84" y="316" width="528" height="34" rx="10" fill="#fff"/>${t(98, 338, "14:00", sans(14, 750, C.navy))}${t(150, 338, "Liberia airport (LIR) → Tamarindo", sans(14, 500, C.ink))}${t(598, 338, "Sedan · CBR-0003", sans(12.5, 600, C.soft), 'text-anchor="end"')}</g>
<g class="rise" ${d(3.0)}><rect x="532" y="380" width="280" height="44" rx="22" fill="${C.navy}"/>${t(672, 408, "Raise high-season rates 10%", sans(16, 600, "#fff"), 'text-anchor="middle"')}</g>
<g class="rise" ${d(3.6)}><rect x="68" y="438" width="300" height="28" rx="14" fill="#eef2f4"/>${t(82, 457, "altair · proponer_cambios_catalogo", `font:500 13px ${MONO};fill:#24414c`)}</g>
<g class="rise" ${d(4.1)}><rect x="68" y="476" width="560" height="100" rx="18" fill="#f3f6f7"/>
 ${t(88, 504, "Draft ready. High-season rates +10%. Nothing is published yet.", sans(14.5, 600, C.navy))}
 <rect x="84" y="518" width="528" height="40" rx="10" fill="#fff"/>${t(98, 543, "Waiting for approval in your panel", sans(13.5, 500, C.text))}
 <g class="fade" ${d(5.2)}><rect x="508" y="525" width="92" height="26" rx="13" fill="#e6f6ea"/>${t(554, 543, "Approved ✓", sans(12.5, 700, "#22863a"), 'text-anchor="middle"')}</g></g>
<g class="rise" ${d(.4)}>${t(880, 76, "TOOLS OF THE CONNECTOR", sans(12, 700, C.soft, "letter-spacing:2px"))}</g>
${tools.map((x, i) => `<g class="rise" ${d(.5 + i * .12)}><rect x="880" y="${94 + i * 40}" width="${30 + x.length * 8.4}" height="30" rx="15" fill="#fff" stroke="${C.navy}" stroke-opacity=".1"/>${t(895, 114 + i * 40, x, `font:500 13.5px ${MONO};fill:${C.ink}`)}</g>`).join("")}
<g class="rise" ${d(1.8)}>${card(880, 470, 360, 130, 20)}
 ${check(908, 504, .8)}${t(926, 509, "Scope and role checked in the database", sans(14, 650, C.navy))}
 ${check(908, 538, .8)}${t(926, 543, "Every call logged for the owner", sans(14, 650, C.navy))}
 ${check(908, 572, .8)}${t(926, 577, "Drafts only · never touches money", sans(14, 650, C.navy))}</g>
${t(48, 628, "Sample conversation on the demo business · the tool names are the real ones", sans(12, 500, C.soft))}`;
  out("claude.svg", svg(W, H, "A sample conversation: the owner asks their own Claude what is on tomorrow and asks it to raise high-season rates; Claude answers with real bookings and prepares a draft that a person approves.", "Run it from your own Claude", body));
}

// ------------------------------------------------------------------ one business, one instance
{ const W = 1280, H = 560;
  const inst = (x, name, dl) => `<g class="rise" ${d(dl)}>${card(x, 40, 360, 300, 24)}
 ${t(x + 30, 88, name, `font-family:IS,Georgia,serif;font-size:32px;fill:${C.navy}`)}
 ${["Own database", "Own booking site", "Own domain"].map((r, i) => `<rect x="${x + 26}" y="${110 + i * 70}" width="308" height="56" rx="16" fill="#f7f4ec"/><rect x="${x + 42}" y="${124 + i * 70}" width="28" height="28" rx="8" fill="${C.navy}"/><rect x="${x + 50}" y="${132 + i * 70}" width="12" height="11" rx="3" fill="none" stroke="${C.gold}" stroke-width="2"/>${t(x + 84, 144 + i * 70, r, sans(17, 650, C.ink))}`).join("")}</g>`;
  const ck = ["Two-step sign-in (TOTP) for every staff action", "Row Level Security with explicit grants", "The server recalculates every price", "272 database access checks, two grant modes"];
  const body = `${inst(40, "Costa Brisa (demo)", .1)}${inst(460, "Your business", .3)}${inst(880, "The next one", .5)}
<path class="draw" pathLength="1" ${d(1.1)} d="M420 56 V 324" stroke="${C.navy}" stroke-opacity=".25" stroke-width="2.5" stroke-dasharray=".02 .02"/>
<path class="draw" pathLength="1" ${d(1.25)} d="M840 56 V 324" stroke="${C.navy}" stroke-opacity=".25" stroke-width="2.5" stroke-dasharray=".02 .02"/>
<g class="rise" ${d(1.4)}>${t(640, 386, "Nothing is shared.", `font-family:ISI,Georgia,serif;font-style:italic;font-size:34px;fill:${C.goldDark}`, 'text-anchor="middle"')}</g>
${ck.map((c, i) => { const x = i % 2 ? 660 : 40, y = i < 2 ? 410 : 474; return `<g class="rise" ${d(1.6 + i * .15)}><rect x="${x}" y="${y}" width="580" height="52" rx="26" fill="#fff" stroke="${C.navy}" stroke-opacity=".08"/>${check(x + 30, y + 26, .85)}${t(x + 54, y + 32, c, sans(16, 650, C.navy))}</g>`; }).join("")}`;
  out("instances.svg", svg(W, H, "One business, one instance: each business has its own database, booking site and domain; nothing is shared. Two-step sign-in, Row Level Security, server-side prices and 272 access checks.", "Secure by design", body));
}

// ------------------------------------------------------------------ divider + buttons
out("divider.svg", `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 40" width="1280" height="40" role="img" aria-label=""><defs><linearGradient id="l" x1="0" x2="1"><stop offset="0" stop-color="${C.gold}" stop-opacity="0"/><stop offset=".5" stop-color="${C.gold}" stop-opacity=".9"/><stop offset="1" stop-color="${C.gold}" stop-opacity="0"/></linearGradient></defs>
<style>${BASE_CSS}${REDUCED}</style><path d="M160 20 H 600 M680 20 H 1120" stroke="url(#l)" stroke-width="1.2"/><g transform="translate(628 8)"><path class="twinkle" fill="${C.gold}" d="${STAR}"/></g></svg>`);
const button = (f, label, filled, w) => out(f, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} 52" width="${w}" height="52" role="img" aria-label="${esc(label)}">
<rect x="1" y="1" width="${w - 2}" height="50" rx="25" fill="${filled ? C.navy : "#fff"}" stroke="${filled ? C.navy : "rgba(0,43,66,.18)"}" stroke-width="1.5"/>
<path transform="translate(22 17) scale(.75)" fill="${C.gold}" d="${STAR}"/>
<text x="${(w + 26) / 2}" y="32" text-anchor="middle" style="font:650 16px ${SANS};fill:${filled ? "#fff" : C.navy}">${esc(label)}</text></svg>`);
button("btn-site.svg", "Product site · altair-hub", true, 270);
button("btn-demo.svg", "Live demo business", false, 230);
button("btn-video.svg", "Watch the 2-min demo", false, 240);
button("btn-discovery.svg", "Book a free discovery session", true, 320);
