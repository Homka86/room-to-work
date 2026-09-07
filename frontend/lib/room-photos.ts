export type RoomPhoto = {
  url: string;
  title: string;
};

// Curated high quality interior photography for coworking rooms
const QUIET_PHOTOS: RoomPhoto[] = [
  {
    url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
    title: 'Индивидуальные рабочие места с естественным светом',
  },
  {
    url: 'https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&w=800&q=80',
    title: 'Тихая зона с эргономичными креслами и зеленью',
  },
  {
    url: 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=800&q=80',
    title: 'Фокус-пространство с индивидуальным освещением',
  },
  {
    url: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80',
    title: 'Минималистичные рабочие столы',
  },
];

const TEAM_PHOTOS: RoomPhoto[] = [
  {
    url: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80',
    title: 'Командное пространство с большими столами для проектов',
  },
  {
    url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
    title: 'Зона для брейнштормов и совместной работы',
  },
  {
    url: 'https://images.unsplash.com/photo-1531497865144-0464ef8fb9a9?auto=format&fit=crop&w=800&q=80',
    title: 'Современный открытый коворкинг для команд',
  },
  {
    url: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=800&q=80',
    title: 'Просторная зона с досками для записей',
  },
];

const MEETING_PHOTOS: RoomPhoto[] = [
  {
    url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80',
    title: 'Переговорная со стеклянной перегородкой и экраном',
  },
  {
    url: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=800&q=80',
    title: 'Круглый стол для обсуждений и консультаций',
  },
  {
    url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80',
    title: 'Уютная переговорная для созвонов и встреч',
  },
  {
    url: 'https://images.unsplash.com/photo-1568992687947-868a62a9f521?auto=format&fit=crop&w=800&q=80',
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
