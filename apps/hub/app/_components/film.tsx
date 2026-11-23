"use client";

import { useRef, useState } from "react";

type FilmProps = { play: string; length: string; label: string; note: string };

/** The Altair film in a calm 16:9 frame (never wider than 960px). Nothing loads until the visitor presses play. */
export function Film({ play, length, label, note }: FilmProps) {
  const v = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  return (
    <figure className="h-film">
      <div className="h-film-frame">
        <video
          ref={v}
          src="/media/altair-demo.mp4"
          poster="/media/altair-demo-poster.jpg"
          width={1280}
          height={720}
          preload="none"
          playsInline
          controls={playing}
          onEnded={() => setPlaying(false)}
          aria-label={label}
        />
        {!playing ? (
          <button
            type="button"
            className="h-film-play"
            aria-label={`${play} (${length})`}
            onClick={() => {
              setPlaying(true);
              void v.current?.play();
            }}
          >
            <span className="h-film-pill glass" aria-hidden="true">
              <span className="h-film-disc">
                <svg width="18" height="18" viewBox="0 0 24 24"><path d="M8.5 5.8v12.4a.8.8 0 0 0 1.2.7l10-6.2a.8.8 0 0 0 0-1.4l-10-6.2a.8.8 0 0 0-1.2.7z" fill="currentColor" /></svg>
              </span>
              <span className="h-film-label">{play} <i>· {length}</i></span>
            </span>
          </button>
        ) : null}
      </div>
      <figcaption>{note}</figcaption>
    </figure>
  );
}
