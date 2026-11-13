"use client";

import { useRef, useState } from "react";
import { Play } from "lucide-react";

// Vertical 9:16 reel, self-hosted. Nothing but the poster loads until the
// visitor taps play (preload="none"), so it costs the ad landing page nothing
// up front. Starts muted; the native controls let them unmute.
export function ReelPlayer({ src, poster, title, caption }: { src: string; poster: string; title: string; caption?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);

  const start = () => {
    setStarted(true);
    void videoRef.current?.play().catch(() => {});
  };

  return (
    <div className="relative aspect-[9/16] w-full overflow-hidden rounded-[28px] border border-mc-gold/40 bg-mc-navy shadow-[0_0_60px_-10px_rgba(242,193,78,0.45)]">
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        preload="none"
        playsInline
        muted
        controls={started}
        className="h-full w-full object-cover"
        aria-label={title}
      />
      {!started && (
        <button
          type="button"
          onClick={start}
          className="group absolute inset-0 flex items-center justify-center bg-gradient-to-t from-mc-ink/70 via-transparent to-transparent"
          aria-label={`Play video: ${title}`}
        >
          <span className="flex flex-col items-center gap-3">
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[linear-gradient(180deg,#FFE08A,#F2C14E_45%,#D4A531)] shadow-[0_0_40px_rgba(242,193,78,0.6)] transition group-hover:scale-105">
              <Play className="ml-1 h-8 w-8 fill-mc-ink text-mc-ink" aria-hidden />
            </span>
            {caption && <span className="rounded-full bg-mc-ink/85 px-3 py-1 text-xs font-semibold text-white">{caption}</span>}
          </span>
        </button>
      )}
    </div>
  );
}
