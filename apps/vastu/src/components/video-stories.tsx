"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { VIDEOS, YOUTUBE_CHANNEL_URL } from "@/lib/site";

// Shorts are 9:16. Each card shows only YouTube's thumbnail until tapped, so
// the landing page doesn't load several YouTube players up front (it's an
// ad landing page — mobile speed matters). The player uses the privacy-
// enhanced youtube-nocookie.com domain.
export function VideoStories() {
  if (VIDEOS.length === 0) return null;

  return (
    <section className="section">
      <p className="eyebrow">Real people, real spaces</p>
      <h2 className="section-title">Client stories &amp; site visits</h2>
      <p className="mt-3 max-w-2xl text-muted">Hear from clients and see how Biprangshu looks at a space during a consultation.</p>

      <div
        className={`-mx-4 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0 ${VIDEOS.length === 1 ? "justify-center" : ""}`}
      >
        {VIDEOS.map((v) => (
          <VideoCard key={v.id} {...v} />
        ))}
      </div>

      <div className="mt-6 text-center">
        <a href={YOUTUBE_CHANNEL_URL} target="_blank" rel="noopener noreferrer" className="btn-outline">
          <Play className="h-4 w-4" aria-hidden /> More on YouTube
        </a>
      </div>
    </section>
  );
}

function VideoCard({ id, title, tag }: (typeof VIDEOS)[number]) {
  const [playing, setPlaying] = useState(false);

  return (
    <figure className="w-[62%] shrink-0 snap-center sm:w-56">
      <div className="relative aspect-[9/16] overflow-hidden rounded-2xl border border-gold-line bg-night-800">
        {playing ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&playsinline=1&rel=0&modestbranding=1`}
            title={`${tag}: ${title}`}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            className="group absolute inset-0 h-full w-full"
            aria-label={`Play video — ${tag}: ${title}`}
          >
            {/* hqdefault is 4:3 with the vertical Short centred; object-cover crops to just the Short. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition group-hover:scale-105"
            />
            <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-gold-gradient shadow-lg transition group-hover:scale-110">
              <Play className="ml-1 h-7 w-7 fill-navy text-navy" aria-hidden />
            </span>
          </button>
        )}
      </div>
      <figcaption className="mt-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-gold">{tag}</span>
        <p className="mt-0.5 text-sm font-semibold text-cream">{title}</p>
      </figcaption>
    </figure>
  );
}
