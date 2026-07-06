'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Banner } from '@/lib/types';
import { cn } from '@/lib/utils';

interface BannerCarouselProps {
  banners: Banner[];
}

export function BannerCarousel({ banners }: BannerCarouselProps) {
  const [index, setIndex] = useState(0);
  const active = banners.filter((b) => b.is_active && (b.images?.length ?? 0) > 0);
  const total = active.length;

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % Math.max(total, 1));
  }, [total]);

  const prev = useCallback(() => {
    setIndex((i) => (i - 1 + Math.max(total, 1)) % Math.max(total, 1));
  }, []);

  useEffect(() => {
    if (total <= 1) return;
    const current = active[index];
    const duration = current?.duration || 5000;
    const t = setInterval(next, duration);
    return () => clearInterval(t);
  }, [index, total, next, active]);

  if (total === 0) {
    return (
      <div className="rounded-2xl silver-card overflow-hidden">
        <div className="aspect-[3/1] silver-gradient flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-3xl md:text-5xl font-bold king-text-3d">King</h2>
            <p className="text-silver-600 mt-2">Premium Digital Services</p>
          </div>
        </div>
      </div>
    );
  }

  const current = active[index];

  return (
    <div className="relative rounded-2xl overflow-hidden silver-card group">
      <div
        className="relative overflow-hidden"
        style={{ aspectRatio: `${current.width} / ${current.height}` }}
      >
        {active.map((banner, i) => (
          <div
            key={banner.id}
            className={cn(
              'absolute inset-0 transition-opacity duration-700',
              i === index ? 'opacity-100' : 'opacity-0 pointer-events-none'
            )}
          >
            {banner.link_url ? (
              <Link href={banner.link_url}>
                <BannerSlide banner={banner} />
              </Link>
            ) : (
              <BannerSlide banner={banner} />
            )}
          </div>
        ))}
      </div>

      {total > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Previous"
            className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full glass-effect flex items-center justify-center text-silver-700 hover:text-silver-900 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={next}
            aria-label="Next"
            className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full glass-effect flex items-center justify-center text-silver-700 hover:text-silver-900 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {active.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  i === index ? 'w-6 bg-silver-700' : 'w-1.5 bg-silver-400'
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function BannerSlide({ banner }: { banner: Banner }) {
  const images = (banner.images || []).filter((img) => img.is_active).sort((a, b) => a.sort_order - b.sort_order);
  const [imgIndex, setImgIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const t = setInterval(() => setImgIndex((i) => (i + 1) % images.length), 3000);
    return () => clearInterval(t);
  }, [images.length]);

  if (images.length === 0) return null;

  return (
    <div className="relative w-full h-full">
      {images.map((img, i) => (
        <div
          key={img.id}
          className={cn(
            'absolute inset-0 transition-opacity duration-700',
            i === imgIndex ? 'opacity-100' : 'opacity-0'
          )}
        >
          <img src={img.image_url} alt={banner.title} className="w-full h-full object-cover" />
        </div>
      ))}
      {banner.title && (
        <div className="absolute inset-0 bg-gradient-to-t from-silver-900/60 via-transparent to-transparent flex items-end p-6">
          <h3 className="text-white text-xl md:text-2xl font-bold drop-shadow-lg">{banner.title}</h3>
        </div>
      )}
    </div>
  );
}
