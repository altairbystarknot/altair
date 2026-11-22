import Image from "next/image";
import { Icon } from "@altair/ui";
import { Star } from "./star";
import { publicFileExists } from "./media";

type ShotProps = {
  /** Path under public/, e.g. /media/shots/site-home.jpg (16:10, 2400x1500). */
  src: string;
  alt: string;
  /** What the address bar shows. */
  url: string;
  caption?: string;
  /** "Sample data" label next to the caption. */
  note?: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
};

/** A real product screenshot in a refined browser frame. Until the file exists the frame shows a quiet surface. */
export function Shot({ src, alt, url, caption, note, sizes = "(max-width: 900px) 100vw, 1200px", priority, className }: ShotProps) {
  const has = publicFileExists(src);
  return (
    <figure className={`h-shot${className ? ` ${className}` : ""}`}>
      <div className="h-shot-win">
        <div className="h-shot-bar" aria-hidden="true">
          <span className="h-shot-dots"><i /><i /><i /></span>
          <span className="h-shot-url"><Icon name="lock" size={11} strokeWidth={2.2} /><span>{url}</span></span>
        </div>
        <div className={`h-shot-view${has ? "" : " empty"}`}>
          {has ? (
            <Image src={src} alt={alt} fill sizes={sizes} priority={priority} />
          ) : (
            <span className="h-shot-wait" aria-hidden="true"><Star size={24} /></span>
          )}
        </div>
      </div>
      {caption ? (
        <figcaption>
          <span>{caption}</span>
          {note ? <span className="h-tag">{note}</span> : null}
        </figcaption>
      ) : null}
    </figure>
  );
}
