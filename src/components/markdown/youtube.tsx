'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Play } from 'lucide-react';

/** YouTube embed that only loads the player after a tap, so pages stay light on mobile data. */
export function YouTube({ id, title = 'Vídeo' }: { id?: string; title?: string }) {
  const [playing, setPlaying] = useState(false);
  if (!id || !/^[\w-]{6,20}$/.test(id)) return null;

  return (
    <div className="not-prose relative my-6 aspect-video overflow-hidden rounded-xl border bg-black">
      {playing ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 size-full"
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label={`Reproduzir: ${title}`}
          className="group absolute inset-0 size-full"
        >
          <Image
            src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
            alt=""
            fill
            sizes="(min-width: 1024px) 800px, 100vw"
            className="object-cover opacity-90 transition-opacity group-hover:opacity-100"
          />
          <span className="absolute left-1/2 top-1/2 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-fd-primary text-fd-primary-foreground shadow-lg transition-transform group-hover:scale-105">
            <Play className="size-6 translate-x-0.5 fill-current" />
          </span>
        </button>
      )}
    </div>
  );
}
