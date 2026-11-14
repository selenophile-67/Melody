import React, { useState } from 'react';
import { Disc3 } from 'lucide-react';

interface ArtworkProps {
  src: string;
  alt: string;
  className?: string;
  rounded?: string;
  loading?: 'lazy' | 'eager';
}

export function Artwork({ src, alt, className = 'w-full h-full', rounded = 'rounded-lg', loading = 'lazy' }: ArtworkProps) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        className={`${className} ${rounded} bg-gradient-to-br from-zinc-800 via-zinc-900 to-black flex flex-col items-center justify-center p-2 text-center border border-white/10 select-none`}
        aria-label={alt}
      >
        <Disc3 className="w-7 h-7 text-[#FF3B5C]/80 mb-1" />
        <span className="text-[11px] font-medium text-zinc-300 line-clamp-2 leading-tight">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`${className} ${rounded} object-cover bg-zinc-900`}
    />
  );
}
