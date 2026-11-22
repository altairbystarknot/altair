/* eslint-disable @next/next/no-img-element -- business photos come from its own storage or the app's stock set */
import type { ImgHTMLAttributes } from "react";
import type { ImageRef } from "./types";
import { cx } from "./utils";

export interface PictureProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "width" | "height"> {
  image: ImageRef;
  alt: string;
  sizes?: string;
  priority?: boolean;
  eager?: boolean;
  blur?: boolean;
  art?: { media: string; image: ImageRef; sizes?: string };
}

/** A photo: a plain image (lazy unless it is the page's first, large one). */
export function Picture({ image, alt, priority, eager, blur: _blur, art, className, sizes: _sizes, ...rest }: PictureProps) {
  const img = <img src={image.src} width={image.width} height={image.height} alt={alt} loading={priority || eager ? "eager" : "lazy"} fetchPriority={priority ? "high" : undefined} decoding="async" className={cx("lg-img", className)} {...rest} />;
  if (!art) return img;
  return (
    <picture>
      <source media={art.media} srcSet={art.image.src} />
      {img}
    </picture>
  );
}
