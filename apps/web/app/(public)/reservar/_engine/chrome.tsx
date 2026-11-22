/* eslint-disable @next/next/no-img-element -- business photos come from its own storage, already sized */

/** The business's photo behind the booking engine, under a soft veil (fixed: one screen-sized layer). */
export function BookingBackdrop({ image }: { image: string | null }) {
  return (
    <div className="be-backdrop" aria-hidden="true">
      {image ? <img src={image} alt="" fetchPriority="high" /> : <div className="be-backdrop__plain" />}
      <div className="be-backdrop__veil" />
      <div className="be-backdrop__glow" />
    </div>
  );
}

/** The business's logo in the engine's top bar, or its name when it has no logo. */
export function EngineLogo({ name, logoUrl }: { name: string; logoUrl: string | null }) {
  return logoUrl ? <img src={logoUrl} alt="" /> : <span className="be-top__name">{name}</span>;
}
