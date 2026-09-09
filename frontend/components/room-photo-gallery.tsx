'use client';

import { useState, useMemo, useRef } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { getRoomPhotos } from '@/lib/room-photos';

interface RoomPhotoGalleryProps {
  roomId: number;
  roomKind: string;
  floor: number;
  roomNumber: string;
  lang?: 'ru' | 'en';
}

export function RoomPhotoGallery({
  roomId,
  roomKind,
  floor,
  roomNumber,
  lang = 'ru',
}: RoomPhotoGalleryProps) {
  const photos = useMemo(() => getRoomPhotos(roomId, roomKind), [roomId, roomKind]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [prevId, setPrevId] = useState(roomId);
  const touchStartX = useRef<number | null>(null);

  // Reset index when room changes (React recommended pattern for state derived from props)
  if (roomId !== prevId) {
    setPrevId(roomId);
    setCurrentIndex(0);
  }

  if (!photos.length) return null;

  const currentPhoto = photos[currentIndex % photos.length];

  function handlePrev() {
    setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  }

  function handleNext() {
    setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    if (diff > 45) {
      handleNext();
    } else if (diff < -45) {
      handlePrev();
    }
    touchStartX.current = null;
  }

  const floorLabel = lang === 'ru' ? `${floor} этаж` : `Floor ${floor}`;

  return (
    <div
      id="room-photo-gallery"
      className="room-photo-gallery relative w-full bg-[#eee8fa] dark:bg-[#252338] overflow-hidden select-none touch-pan-y"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Main Image Area with hover and touch edge controls */}
      <div className="relative w-full h-[200px] sm:h-[220px] bg-[#dfd6f2] dark:bg-[#1f1d2e] overflow-hidden group/gallery">
        <Image
          key={currentPhoto.url}
          src={currentPhoto.url}
          alt={`${lang === 'ru' ? 'Коворкинг' : 'Coworking'} ${roomNumber} - ${currentPhoto.title}`}
          fill
          unoptimized
          sizes="(max-width: 768px) 100vw, 340px"
          className="object-cover transition-opacity duration-300"
          priority
        />

        {/* Left Edge Control */}
        <button
          id="gallery-hover-prev-edge"
          type="button"
          onClick={handlePrev}
          aria-label={lang === 'ru' ? 'Предыдущая фотография' : 'Previous photo'}
          className="absolute left-0 top-0 bottom-0 w-16 sm:w-24 flex items-center justify-start pl-2 z-20 group/left cursor-pointer transition-colors sm:hover:bg-gradient-to-r sm:hover:from-black/30 sm:hover:to-transparent focus-visible:outline-none touch-manipulation"
        >
          <span className="w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-black/60 sm:bg-black/65 hover:bg-black/90 text-white flex items-center justify-center shadow-md backdrop-blur-xs opacity-80 sm:opacity-0 sm:group-hover/left:opacity-100 sm:group-focus-visible/left:opacity-100 transition-all duration-200 transform sm:group-hover/left:scale-105 active:scale-90">
            <ChevronLeft size={18} />
          </span>
        </button>

        {/* Right Edge Control */}
        <button
          id="gallery-hover-next-edge"
          type="button"
          onClick={handleNext}
          aria-label={lang === 'ru' ? 'Следующая фотография' : 'Next photo'}
          className="absolute right-0 top-0 bottom-0 w-16 sm:w-24 flex items-center justify-end pr-2 z-20 group/right cursor-pointer transition-colors sm:hover:bg-gradient-to-l sm:hover:from-black/30 sm:hover:to-transparent focus-visible:outline-none touch-manipulation"
        >
          <span className="w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-black/60 sm:bg-black/65 hover:bg-black/90 text-white flex items-center justify-center shadow-md backdrop-blur-xs opacity-80 sm:opacity-0 sm:group-hover/right:opacity-100 sm:group-focus-visible/right:opacity-100 transition-all duration-200 transform sm:group-hover/right:scale-105 active:scale-90">
            <ChevronRight size={18} />
          </span>
        </button>

        {/* Floor badge on bottom left of image */}
        <div className="absolute bottom-2.5 left-3 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-white text-[11px] font-medium shadow-xs z-10 pointer-events-none">
          <MapPin size={11} />
          <span>{floorLabel}</span>
        </div>

        {/* Dots indicators on bottom right */}
        <div className="absolute bottom-2.5 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-black/50 backdrop-blur-sm z-10">
          {photos.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(idx);
              }}
              aria-label={lang === 'ru' ? `Перейти к фото ${idx + 1}` : `Go to photo ${idx + 1}`}
              className={`h-2 rounded-full transition-all cursor-pointer touch-manipulation ${
                idx === currentIndex % photos.length ? 'w-5 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
