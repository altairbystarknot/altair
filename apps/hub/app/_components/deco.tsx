import { Star } from "./star";

/**
 * Quiet decoration for an inner page header: a few frosted tiles and soft spheres floating at an angle,
 * static (no animation, no blur), drawn only where there is room for them.
 */
export function HeaderArt() {
  return (
    <div className="h-art" aria-hidden="true">
      <i className="h-art-grid" />
      <i className="h-art-tile t1"><Star size={22} /></i>
      <i className="h-art-tile t2" />
      <i className="h-art-tile t3" />
      <i className="h-art-orb o1" />
      <i className="h-art-orb o2" />
    </div>
  );
}
