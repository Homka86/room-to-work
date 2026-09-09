import { DoorOpen } from 'lucide-react';
import { RoomCard } from './room-card';
import { getRoomAvailability, type Room, type RoomState } from '@/lib/campus';
import type { Translation, Language } from '@/lib/translations';

interface FloorPlanViewProps {
  floor: number;
  rooms: Room[];
  selectedId: number;
  date: string;
  time: number | null;
  activeBookingRoomId?: number;
  t: Translation;
  lang: Language;
  onFloorChange?: (floor: number) => void;
  onSelectRoom: (roomId: number) => void;
  onlyFree?: boolean;
}

export function FloorPlanView({
  floor,
  rooms,
  selectedId,
  date,
  time,
  activeBookingRoomId,
  t,
  lang,
  onSelectRoom,
}: FloorPlanViewProps) {
  const floorRooms = rooms.filter((r) => r.floor === floor);
  const visibleRooms = floorRooms;

  return (
    <section className="floor-section" aria-label="Выбор коворкинга">
      <div className="floor-card">
        <div className="floor-card-heading">
          <h2>{t.floorNames[floor - 1]}</h2>
        </div>

        <div className="map-scroll">
          <div className="floor-plan">
            {/* Upper row of rooms */}
            <div className="room-row mb-3.5">
              {visibleRooms.slice(0, 4).map((room, index) => {
                const availability: RoomState = getRoomAvailability(room, date, time);
                const isBookedByMe = activeBookingRoomId === room.id;

                return (
                  <RoomCard
                    key={room.id}
                    room={room}
                    availability={availability}
                    selectedId={selectedId}
                    isBookedByMe={isBookedByMe}
                    index={index}
                    t={t}
                    lang={lang}
                    onSelect={onSelectRoom}
                  />
                );
              })}
            </div>

            {/* Lower row of rooms */}
            <div className="room-row">
              {visibleRooms.slice(4).map((room, index) => {
                const availability: RoomState = getRoomAvailability(room, date, time);
                const isBookedByMe = activeBookingRoomId === room.id;

                return (
                  <RoomCard
                    key={room.id}
                    room={room}
                    availability={availability}
                    selectedId={selectedId}
                    isBookedByMe={isBookedByMe}
                    index={index + 4}
                    t={t}
                    lang={lang}
                    onSelect={onSelectRoom}
                  />
                );
              })}

              {floorRooms.length === 7 && (
                <div className="common-space">
                  <DoorOpen size={25} />
                  <span>{t.loungeArea}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CLEAN LEGEND (СВОБОДНО / СКОРО БУДЕТ ЗАНЯТО / ЗАНЯТО) */}
        {date && time !== null && (
          <div className="map-legend">
            <span>
              <i className="legend-free" />
              {t.legendFree}
            </span>
            <span>
              <i className="legend-soon" />
              {t.legendSoon}
            </span>
            <span>
              <i className="legend-busy" />
              {t.legendBusy}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
