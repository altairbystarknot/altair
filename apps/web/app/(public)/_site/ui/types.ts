/** A photo the template shows: its URL and its pixel size (for the browser's layout before it loads). */
export type ImageRef = { src: string; width: number; height: number; alt?: Record<string, string> };
