export type Language = 'ru' | 'en';

export function getRoomCode(roomNumber: string | number, lang: Language = 'ru'): string {
  const prefix = lang === 'ru' ? 'К' : 'C';
  return `${prefix}${roomNumber}`;
}

export interface Translation {
  brand: string;
  brandSubtitle: string;
  user: string;
  userProfile: string;
  roomCodePrefix: string;
  myBookings: string;
  additionalInfo: string;
  additionalInfoDescription: string;
  ratingLabel: string;
  ratingInfoTitle: string;
  ratingInfo: string;
  popularityInfoTitle: string;
  popularityInfo: string;
  bookingRulesTitle: string;
  bookingRules: string;
  roleStudent: string;
  roleTeacher: string;
  onlyFree: string;
  languageSwitch: string;
  themeSwitch: string;
  lightTheme: string;
  darkTheme: string;
  heading: string;
  subheading: string;
  when: string;
  time: string;
  floorTabs: readonly string[] | string[];
  floorNames: readonly string[] | string[];
  coworking: string;
  seats: string;
  free: string;
  soonOccupied: string;
  busy: string;
  until: string;
  bookedAt: string;
  bookedByMe: string;
  legendFree: string;
  legendSoon: string;
  legendBusy: string;
  photos: string;
  dailySchedule: string;
  freeUntilClosing: string;
  untilTime: string;
  chooseCoworking: string;
  manageThisBooking: string;
  freeFrom: string;
  footerQuote: string;
  campusHours: string;
  selectDatePrompt: string;
  selectTimePrompt: string;
  selectDateTime: string;
  chooseDateFirst: string;
  upcomingWeek: string;
  today: string;
  tomorrow: string;
  selectDateToViewSchedule: string;
  selectTimeToBook: string;
  loungeArea: string;
  floorWord: string;
  campusRuleNotice: string;
  youBookedThis: string;
  cancelBooking: string;
  confirmCancel: string;
  details: string;
  purpose: string;
  active: string;
  completed: string;
  cancelled: string;
  bookingDialogTitle: string;
  bookingDialogSubtitle: string;
  nameLabel: string;
  namePlaceholder: string;
  peopleCountLabel: string;
  maximum: string;
  purposeLabel: string;
  dateLabel: string;
  startTimeLabel: string;
  endTimeLabel: string;
  durationLabel: string;
  confirmBookingButton: string;
  successTitle: string;
  successSubtitle: string;
  goToMyBookings: string;
  close: string;
  noActiveBooking: string;
  noActiveBookingHint: string;
  noHistory: string;
  activeBookingTab: string;
  historyTab: string;
  hours: string;
  mins: string;
  kinds: Record<string, string>;
  purposes: Record<string, string>;
  amenities: {
    seats: string;
    wifi: string;
    sockets: string;
    quietZone: string;
    canTalk: string;
    screen: string;
  };
}

export const TRANSLATIONS: Record<Language, Translation> = {
  ru: {
    brand: 'есть место',
    brandSubtitle: 'бронирование учебных пространств',
    user: 'Пользователь',
    userProfile: 'Профиль пользователя',
    roomCodePrefix: 'К',
    myBookings: 'Мои бронирования',
    additionalInfo: 'Доп. информация',
    additionalInfoDescription: 'Как работает рейтинг и доступ к пространствам',
    ratingLabel: 'Рейтинг',
    ratingInfoTitle: 'Рейтинг пользователя',
    ratingInfo:
      'Начальный рейтинг ученика — 0. Завершённая бронь даёт +1 балл. Одна поздняя отмена в месяц бесплатна, а отмена более чем за 2 часа до начала не меняет рейтинг. Следующие поздние отмены снимают 2 балла.',
    popularityInfoTitle: 'Доступ к пространствам',
    popularityInfo:
      'При отрицательном рейтинге часть самых востребованных пространств может быть временно недоступна.',
    bookingRulesTitle: 'Правила бронирования',
    bookingRules:
      'У одного аккаунта может быть только одна активная бронь. Чтобы забронировать другое пространство, сначала отмените текущую бронь. У каждого пространства на выбранный слот может быть только один ответственный.',
    roleStudent: 'Ученик',
    roleTeacher: 'Преподаватель',
    onlyFree: 'Показывать только свободные',
    languageSwitch: 'Смена языка',
    themeSwitch: 'Смена темы',
    lightTheme: 'Светлая тема',
    darkTheme: 'Тёмная тема',
    heading: 'Место для твоих идей',
    subheading: 'Найди свободный коворкинг на нужном этаже.',
    when: 'Когда',
    time: 'Ко времени',
    floorTabs: ['1 этаж', '2 этаж', '3 этаж'],
    floorNames: ['Первый этаж', 'Второй этаж', 'Третий этаж'],
    coworking: 'Коворкинг',
    seats: 'мест',
    free: 'Свободно',
    soonOccupied: 'Скоро будет занято',
    busy: 'Занято',
    until: 'До',
    bookedAt: 'Займут в течение',
    bookedByMe: 'Ваша бронь',
    legendFree: 'Свободно',
    legendSoon: 'Скоро будет занято',
    legendBusy: 'Занято',
    photos: 'Фотографии',
    dailySchedule: 'Расписание на день',
    freeUntilClosing: 'Свободно до закрытия',
    untilTime: '22:00',
    chooseCoworking: 'Забронировать коворкинг',
    manageThisBooking: 'Управление бронью этого места',
    freeFrom: 'Свободно с',
    footerQuote: 'Есть место — учиться, работать, создавать.',
    campusHours: 'Кампус открыт с 08:00 до 22:00',
    selectDatePrompt: 'Выберите дату',
    selectTimePrompt: 'Выберите время',
    selectDateTime: 'Занятость в расписании',
    chooseDateFirst: 'Сначала выберите дату',
    upcomingWeek: 'Ближайшая неделя',
    today: 'Сегодня',
    tomorrow: 'Завтра',
    selectDateToViewSchedule: 'Выберите дату для просмотра расписания',
    selectTimeToBook: 'Выберите время для брони',
    loungeArea: 'Зона отдыха',
    floorWord: 'этаж',
    campusRuleNotice: 'Один аккаунт — одна активная бронь',
    youBookedThis: 'Вы забронировали это место',
    cancelBooking: 'Отменить бронь',
    confirmCancel: 'Вы уверены, что хотите отменить бронь?',
    details: 'Детали',
    purpose: 'Цель',
    active: 'Активно',
    completed: 'Завершено',
    cancelled: 'Отменено',
    bookingDialogTitle: 'Бронирование места',
    bookingDialogSubtitle: 'Заполните данные для резервирования места',
    nameLabel: 'Ваше имя и фамилия',
    namePlaceholder: 'Например, Иван Иванов',
    peopleCountLabel: 'Количество человек',
    maximum: 'Максимум',
    purposeLabel: 'Цель бронирования',
    dateLabel: 'Дата',
    startTimeLabel: 'Время начала',
    endTimeLabel: 'Время окончания',
    durationLabel: 'Длительность',
    confirmBookingButton: 'Подтвердить бронь',
    successTitle: 'Коворкинг успешно забронирован!',
    successSubtitle: 'Ждем вас в назначенное время',
    goToMyBookings: 'Перейти в мои бронирования',
    close: 'Закрыть',
    noActiveBooking: 'У вас пока нет активных бронирований',
    noActiveBookingHint: 'Выберите свободное место на этаже и забронируйте его',
    noHistory: 'История бронирований пуста',
    activeBookingTab: 'Активная бронь',
    historyTab: 'История',
    hours: 'ч',
    mins: 'мин',
    kinds: {
      'Тихая работа': 'Тихая работа',
      'Для команды': 'Для команды',
      'Для встречи': 'Для встречи',
    },
    purposes: {
      'Командный проект': 'Командный проект',
      'Онлайн-созвон': 'Онлайн-созвон',
      'Встреча и обсуждение': 'Встреча и обсуждение',
      'Индивидуальная работа': 'Индивидуальная работа',
      'Подготовка к экзамену': 'Подготовка к экзамену',
      'Подготовка к презентации': 'Подготовка к презентации',
      'Работа над курсовой': 'Работа над курсовой',
      'Работа над дипломом': 'Работа над дипломом',
      'Учебная консультация': 'Учебная консультация',
      'Проектная встреча': 'Проектная встреча',
      'Мозговой штурм': 'Мозговой штурм',
      'Подготовка онлайн-материалов': 'Подготовка онлайн-материалов',
      'Учёба / подготовка к парам': 'Учёба / подготовка к парам',
      'Командный проект / созвон': 'Командный проект / созвон',
      'Встреча с преподавателем': 'Встреча с преподавателем',
      'Другое (укажу сам)': 'Другое (укажу сам)',
    },
    amenities: {
      seats: 'мест',
      wifi: 'Wi-Fi',
      sockets: 'Розетки',
      quietZone: 'Тихая зона',
      canTalk: 'Можно общаться',
      screen: 'Экран',
    },
  },
  en: {
    brand: 'room to work',
    brandSubtitle: 'booking for study spaces',
    user: 'User',
    userProfile: 'User profile',
    roomCodePrefix: 'C',
    myBookings: 'My Bookings',
    additionalInfo: 'More information',
    additionalInfoDescription: 'How ratings and access to spaces work',
    ratingLabel: 'Rating',
    ratingInfoTitle: 'User rating',
    ratingInfo:
      'A student starts with 0 points. A completed booking adds 1 point. One late cancellation per month is free, while cancelling more than 2 hours before the start does not change the rating. Further late cancellations remove 2 points.',
    popularityInfoTitle: 'Access to spaces',
    popularityInfo:
      'With a negative rating, some of the most requested spaces may be temporarily unavailable.',
    bookingRulesTitle: 'Booking rules',
    bookingRules:
      'One account can have only one active reservation. Cancel the current reservation before booking another space. Each space can have one responsible person for a selected slot.',
    roleStudent: 'Student',
    roleTeacher: 'Teacher',
    onlyFree: 'Show available only',
    languageSwitch: 'Switch language',
    themeSwitch: 'Switch theme',
    lightTheme: 'Light theme',
    darkTheme: 'Dark theme',
    heading: 'A Space for Your Ideas',
    subheading: 'Find an available coworking space on the right floor.',
    when: 'Date',
    time: 'Time',
    floorTabs: ['1st floor', '2nd floor', '3rd floor'],
    floorNames: ['First floor', 'Second floor', 'Third floor'],
    coworking: 'Coworking',
    seats: 'seats',
    free: 'Available',
    soonOccupied: 'Soon occupied',
    busy: 'Occupied',
    until: 'Until',
    bookedAt: 'Occupied in',
    bookedByMe: 'Your booking',
    legendFree: 'Available',
    legendSoon: 'Soon occupied',
    legendBusy: 'Occupied',
    photos: 'Photos',
    dailySchedule: 'Daily schedule',
    freeUntilClosing: 'Available until closing',
    untilTime: '22:00',
    chooseCoworking: 'Book coworking',
    manageThisBooking: 'Manage this booking',
    freeFrom: 'Available from',
    footerQuote: 'Room to work — learn, create, collaborate.',
    campusHours: 'Campus open daily 08:00 – 22:00',
    selectDatePrompt: 'Select date',
    selectTimePrompt: 'Select time',
    selectDateTime: 'See daily schedule',
    chooseDateFirst: 'Select date first',
    upcomingWeek: 'Upcoming week',
    today: 'Today',
    tomorrow: 'Tomorrow',
    selectDateToViewSchedule: 'Select a date to view the daily schedule',
    selectTimeToBook: 'Select time to book',
    loungeArea: 'Lounge area',
    floorWord: 'floor',
    campusRuleNotice: 'Campus rule: 1 active reservation per person',
    youBookedThis: 'You reserved this workspace',
    cancelBooking: 'Cancel reservation',
    confirmCancel: 'Are you sure you want to cancel this reservation?',
    details: 'Details',
    purpose: 'Purpose',
    active: 'Active',
    completed: 'Completed',
    cancelled: 'Cancelled',
    bookingDialogTitle: 'Workspace Reservation',
    bookingDialogSubtitle: 'Fill in the details to reserve this workspace',
    nameLabel: 'Your full name',
    namePlaceholder: 'e.g. Alex Johnson',
    peopleCountLabel: 'Number of people',
    maximum: 'Maximum',
    purposeLabel: 'Booking purpose',
    dateLabel: 'Date',
    startTimeLabel: 'Start time',
    endTimeLabel: 'End time',
    durationLabel: 'Duration',
    confirmBookingButton: 'Confirm Reservation',
    successTitle: 'Workspace reserved successfully!',
    successSubtitle: 'We look forward to seeing you at the scheduled time',
    goToMyBookings: 'Go to my bookings',
    close: 'Close',
    noActiveBooking: 'You have no active reservations',
    noActiveBookingHint: 'Choose an available workspace and reserve it',
    noHistory: 'Reservation history is empty',
    activeBookingTab: 'Active booking',
    historyTab: 'History',
    hours: 'h',
    mins: 'min',
    kinds: {
      'Тихая работа': 'Quiet workspace',
      'Для команды': 'Team space',
      'Для встречи': 'Meeting room',
    },
    purposes: {
      'Командный проект': 'Team project',
      'Онлайн-созвон': 'Online call',
      'Встреча и обсуждение': 'Meeting and discussion',
      'Индивидуальная работа': 'Individual work',
      'Подготовка к экзамену': 'Exam preparation',
      'Подготовка к презентации': 'Presentation preparation',
      'Работа над курсовой': 'Coursework',
      'Работа над дипломом': 'Thesis work',
      'Учебная консультация': 'Academic consultation',
      'Проектная встреча': 'Project meeting',
      'Мозговой штурм': 'Brainstorming',
      'Подготовка онлайн-материалов': 'Preparing online materials',
      'Учёба / подготовка к парам': 'Studying / Exam prep',
      'Командный проект / созвон': 'Team project / Meeting',
      'Встреча с преподавателем': 'Meeting with professor',
      'Другое (укажу сам)': 'Other (specify below)',
    },
    amenities: {
      seats: 'seats',
      wifi: 'Wi-Fi',
      sockets: 'Power sockets',
      quietZone: 'Quiet zone',
      canTalk: 'Discussion friendly',
      screen: 'Display screen',
    },
  },
} as const;
