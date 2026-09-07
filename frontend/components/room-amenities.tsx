import { Users, Wifi, Plug, Volume2, VolumeX, Monitor } from 'lucide-react';
import type { Translation } from '@/lib/translations';

export type AmenityType = 'seats' | 'wifi' | 'sockets' | 'quiet' | 'talk' | 'monitor';

export interface AmenitySpriteProps {
  type: AmenityType;
  value?: string | number;
  size?: number;
  className?: string;
}

export function AmenitySprite({
  type,
  value,
  size = 17,
  className = '',
}: AmenitySpriteProps) {
  const iconMap = {
    seats: <Users size={size} />,
    wifi: <Wifi size={size} />,
    sockets: <Plug size={size} />,
    quiet: <VolumeX size={size} />,
    talk: <Volume2 size={size} />,
    monitor: <Monitor size={size} />,
  };

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      {iconMap[type]}
      {value !== undefined && <span>{value}</span>}
    </span>
  );
}

interface RoomAmenitiesProps {
  capacity: number;
  quiet: boolean;
  monitor: boolean;
  t: Translation;
  className?: string;
}

export function RoomAmenities({
  capacity,
  quiet,
  monitor,
  t,
  className = '',
}: RoomAmenitiesProps) {
  return (
    <div id="room-amenities-list" className={`amenities ${className}`}>
      <span>
        <AmenitySprite type="seats" value={`${capacity} ${t.amenities.seats}`} />
      </span>
      <span>
        <AmenitySprite type="wifi" value={t.amenities.wifi} />
      </span>
      <span>
        <AmenitySprite type="sockets" value={t.amenities.sockets} />
      </span>
      <span>
        <AmenitySprite
          type={quiet ? 'quiet' : 'talk'}
          value={quiet ? t.amenities.quietZone : t.amenities.canTalk}
        />
      </span>
      {monitor && (
        <span>
          <AmenitySprite type="monitor" value={t.amenities.screen} />
        </span>
      )}
    </div>
  );
}
