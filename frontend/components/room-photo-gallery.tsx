'use client';

import { useState, useMemo } from 'react';
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

  const floorLabel = lang === 'ru' ? `${floor} этаж` : `Floor ${floor}`;

  return (
    <div
      id="room-photo-gallery"
      className="room-photo-gallery relative w-full bg-[#eee8fa] dark:bg-[#252338] overflow-hidden select-none"
    >
      {/* Main Image Area with hover edge controls */}
      <div className="relative w-full h-[200px] bg-[#dfd6f2] dark:bg-[#1f1d2e] overflow-hidden group/gallery">
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

        {/* Left Edge Hover Control */}
        <button
          id="gallery-hover-prev-edge"
          type="button"
          onClick={handlePrev}
          aria-label={lang === 'ru' ? 'Предыдущая фотография' : 'Previous photo'}
          className="absolute left-0 top-0 bottom-0 w-24 flex items-center justify-start pl-2 z-20 group/left cursor-pointer transition-colors hover:bg-gradient-to-r hover:from-black/30 hover:to-transparent focus-visible:outline-none"
        >
          <span className="w-8 h-8 rounded-full bg-black/65 hover:bg-black/90 text-white flex items-center justify-center shadow-md backdrop-blur-xs opacity-0 group-hover/left:opacity-100 group-focus-visible/left:opacity-100 transition-all duration-200 transform group-hover/left:scale-105 active:scale-95">
            <ChevronLeft size={18} />
          </span>
        </button>

        {/* Right Edge Hover Control */}
        <button
          id="gallery-hover-next-edge"
          type="button"
          onClick={handleNext}
          aria-label={lang === 'ru' ? 'Следующая фотография' : 'Next photo'}
          className="absolute right-0 top-0 bottom-0 w-24 flex items-center justify-end pr-2 z-20 group/right cursor-pointer transition-colors hover:bg-gradient-to-l hover:from-black/30 hover:to-transparent focus-visible:outline-none"
        >
          <span className="w-8 h-8 rounded-full bg-black/65 hover:bg-black/90 text-white flex items-center justify-center shadow-md backdrop-blur-xs opacity-0 group-hover/right:opacity-100 group-focus-visible/right:opacity-100 transition-all duration-200 transform group-hover/right:scale-105 active:scale-95">
            <ChevronRight size={18} />
          </span>
        </button>

        {/* Floor badge on bottom left of image */}
        <div className="absolute bottom-2.5 left-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-white text-[11px] font-medium shadow-xs z-10 pointer-events-none">
          <MapPin size={11} />
          <span>{floorLabel}</span>
        </div>

        {/* Dots indicators on bottom right */}
        <div className="absolute bottom-2.5 right-3 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm z-10">
          {photos.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(idx);
              }}
              aria-label={lang === 'ru' ? `Перейти к фото ${idx + 1}` : `Go to photo ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                idx === currentIndex % photos.length ? 'w-4 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
