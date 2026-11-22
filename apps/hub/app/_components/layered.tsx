import Image from "next/image";
import { Icon } from "@altair/ui";
import { publicFileExists } from "./media";

type Layer = { src: string; url: string; alt: string };

function Win({ layer, cls, sizes }: { layer: Layer; cls: string; sizes: string }) {
  const has = publicFileExists(layer.src);
  return (
    <div className={`h-layer ${cls}`}>
      <div className="h-shot-bar" aria-hidden="true">
        <span className="h-shot-dots"><i /><i /><i /></span>
        <span className="h-shot-url"><Icon name="lock" size={11} strokeWidth={2.2} /><span>{layer.url}</span></span>
      </div>
      <div className="h-layer-view">
        {has ? <Image src={layer.src} alt={layer.alt} fill sizes={sizes} /> : null}
      </div>
    </div>
  );
}

/** Two real screens of the product, one in front of the other, slightly apart in depth. Static. */
export function Layered({ back, front, note, wide = false, className }: { back: Layer; front: Layer; note?: string; wide?: boolean; className?: string }) {
  return (
    <figure className={`h-layered${wide ? " wide" : ""}${className ? ` ${className}` : ""}`}>
      <div className="h-layered-stage">
        <Win layer={back} cls="back" sizes={wide ? "(max-width: 900px) 90vw, 900px" : "(max-width: 900px) 90vw, 620px"} />
        <Win layer={front} cls="front" sizes={wide ? "(max-width: 900px) 80vw, 760px" : "(max-width: 900px) 80vw, 520px"} />
      </div>
      {note ? <figcaption><span className="h-tag">{note}</span></figcaption> : null}
    </figure>
  );
}
