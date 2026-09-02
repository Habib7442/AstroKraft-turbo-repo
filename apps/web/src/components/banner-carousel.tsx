"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { PromoBanner } from "@astrokraft/db";

interface BannerCarouselProps {
  banners: PromoBanner[];
}

const AUTO_SLIDE_MS = 5000;

export function BannerCarousel({ banners }: BannerCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (banners.length <= 1 || isHovered) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, AUTO_SLIDE_MS);
    return () => clearInterval(interval);
  }, [banners.length, isHovered]);

  if (banners.length === 0) return null;

  const goToPrev = () => setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
  const goToNext = () => setCurrentSlide((prev) => (prev + 1) % banners.length);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative w-full select-none overflow-hidden rounded-2xl border border-white/10 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.5)] aspect-[2/1] bg-[#1e1639]"
    >
      <div
        className="flex h-full transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {banners.map((banner, index) => {
          const slide = (
            <div className="relative h-full w-full">
              <Image
                src={banner.image_url}
                alt={banner.title}
                fill
                sizes="(max-width: 768px) 100vw, 1200px"
                className="object-contain"
                priority={index === 0}
              />
              {banner.title || banner.subtitle ? (
                <div className="absolute inset-0 hidden flex-col justify-end bg-gradient-to-t from-foreground/75 via-foreground/10 to-transparent p-5 sm:flex sm:p-8">
                  {banner.title ? (
                    <h3 className="font-serif text-xl font-bold text-white drop-shadow-sm sm:text-3xl">{banner.title}</h3>
                  ) : null}
                  {banner.subtitle ? (
                    <p className="mt-1 max-w-xl text-sm text-surface-tint sm:text-base">{banner.subtitle}</p>
                  ) : null}
                </div>
              ) : null}
            </div>
          );

          return banner.link_url ? (
            <Link key={banner.id} href={banner.link_url} className="block h-full w-full shrink-0">
              {slide}
            </Link>
          ) : (
            <div key={banner.id} className="h-full w-full shrink-0">
              {slide}
            </div>
          );
        })}
      </div>

      {banners.length > 1 ? (
        <>
          <button
            onClick={goToPrev}
            aria-label="Previous banner"
            className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/10 bg-black/40 p-2 text-white opacity-0 shadow-md transition-all hover:bg-gold hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            onClick={goToNext}
            aria-label="Next banner"
            className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/10 bg-black/40 p-2 text-white opacity-0 shadow-md transition-all hover:bg-gold hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5">
            {banners.map((banner, idx) => (
              <button
                key={banner.id}
                onClick={() => setCurrentSlide(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  currentSlide === idx ? "w-5 bg-gold" : "w-1.5 bg-white/50 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
