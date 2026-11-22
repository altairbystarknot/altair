// Country / nationality pick-list for the booking engine: every ISO 3166-1 alpha-2 code (public
// standard). Names come from the browser/runtime (Intl.DisplayNames) in the visitor's language, so the
// list is in English or Spanish without a second table. What is stored on the booking is the ENGLISH
// name (staff, e-mails and exports are in English), or the text typed under "My country is not listed".

export const COUNTRY_CODES: readonly string[] = (
  "AF AX AL DZ AS AD AO AI AQ AG AR AM AW AU AT AZ BS BH BD BB BY BE BZ BJ BM BT BO BQ BA BW BV BR IO BN BG BF BI " +
  "CV KH CM CA KY CF TD CL CN CX CC CO KM CG CD CK CR CI HR CU CW CY CZ DK DJ DM DO EC EG SV GQ ER EE SZ ET FK FO FJ " +
  "FI FR GF PF TF GA GM GE DE GH GI GR GL GD GP GU GT GG GN GW GY HT HM VA HN HK HU IS IN ID IR IQ IE IM IL IT JM JP " +
  "JE JO KZ KE KI KP KR KW KG LA LV LB LS LR LY LI LT LU MO MG MW MY MV ML MT MH MQ MR MU YT MX FM MD MC MN ME MS MA " +
  "MZ MM NA NR NP NL NC NZ NI NE NG NU NF MK MP NO OM PK PW PS PA PG PY PE PH PN PL PT PR QA RE RO RU RW BL SH KN LC " +
  "MF PM VC WS SM ST SA SN RS SC SL SG SX SK SI SB SO ZA GS SS ES LK SD SR SJ SE CH SY TW TJ TZ TH TL TG TK TO TT TN " +
  "TR TM TC TV UG UA AE GB US UM UY UZ VU VE VN VG VI WF EH YE ZM ZW"
).split(" ");

/** The selector's "not listed" value (then the person types their country). */
export const COUNTRY_NOT_LISTED = "OTHER";

/** Country name in a language (falls back to the code when the runtime does not know it). */
export function countryName(code: string, locale: "en" | "es"): string {
  try {
    return new Intl.DisplayNames([locale === "es" ? "es" : "en"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

/** Every country, sorted by its name in that language. */
export function countryList(locale: "en" | "es"): { code: string; name: string; english: string }[] {
  return COUNTRY_CODES
    .map((code) => ({ code, name: countryName(code, locale), english: countryName(code, "en") }))
    .sort((a, b) => a.name.localeCompare(b.name, locale));
}
