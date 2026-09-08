export type RoomPhoto = {
  url: string;
  title: string;
};

// Curated high quality interior photography for coworking rooms
const QUIET_PHOTOS: RoomPhoto[] = [
  {
    url: '/room-photos/quiet-1.jpg',
    title: 'Индивидуальные рабочие места с естественным светом',
  },
  {
    url: '/room-photos/quiet-2.jpg',
    title: 'Тихая зона с эргономичными креслами и зеленью',
  },
  {
    url: '/room-photos/quiet-3.jpg',
    title: 'Фокус-пространство с индивидуальным освещением',
  },
  {
    url: '/room-photos/quiet-4.jpg',
    title: 'Минималистичные рабочие столы',
  },
];

const TEAM_PHOTOS: RoomPhoto[] = [
  {
    url: '/room-photos/team-1.jpg',
    title: 'Командное пространство с большими столами для проектов',
  },
  {
    url: '/room-photos/team-2.jpg',
    title: 'Зона для брейнштормов и совместной работы',
  },
  {
    url: '/room-photos/team-3.jpg',
    title: 'Современный открытый коворкинг для команд',
  },
  {
    url: '/room-photos/team-4.jpg',
    title: 'Просторная зона с досками для записей',
  },
];

const MEETING_PHOTOS: RoomPhoto[] = [
  {
    url: '/room-photos/meeting-1.jpg',
    title: 'Переговорная со стеклянной перегородкой и экраном',
  },
  {
    url: '/room-photos/meeting-2.jpg',
    title: 'Круглый стол для обсуждений и консультаций',
  },
  {
    url: '/room-photos/meeting-3.jpg',
    title: 'Уютная переговорная для созвонов и встреч',
  },
  {
    url: '/room-photos/meeting-4.jpg',
    title: 'Комната для презентаций и встреч с куратором',
  },
];

export function getRoomPhotos(roomId: number, kind: string): RoomPhoto[] {
  let pool = QUIET_PHOTOS;
  if (kind === 'Для команды') {
    pool = TEAM_PHOTOS;
  } else if (kind === 'Для встречи') {
    pool = MEETING_PHOTOS;
  }

  // Pick 3 photos stably offset by roomId
  const startIndex = roomId % pool.length;
  const result: RoomPhoto[] = [];
  for (let i = 0; i < 3; i++) {
    result.push(pool[(startIndex + i) % pool.length]);
  }
  return result;
}
