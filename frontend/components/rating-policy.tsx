'use client';

import { ChevronDown, GraduationCap, ShieldAlert, Star } from 'lucide-react';
import { formatDate } from '@/lib/campus';
import {
  COMPLETED_BOOKING_REWARD,
  CANCEL_BOOKING_PENALTY,
  RATING_BLOCK_DAYS,
  RATING_BLOCK_THRESHOLD,
  formatRating,
  getFreeCancellationsLeft,
  isStudentBlocked,
  useUserProfile,
} from '@/lib/account';

export function RatingPolicy() {
  const { profile } = useUserProfile();
  const blocked = isStudentBlocked(profile);
  const student = profile.role === 'student';
  const freeCancellations = getFreeCancellationsLeft(profile);
  return (
    <details
      id="rating-policy-card"
      className={`rating-policy${blocked ? ' rating-policy-blocked' : ''}`}
    >
      <summary>
        <span className="rating-policy-icon">
          {blocked ? (
            <ShieldAlert size={21} />
          ) : student ? (
            <Star size={21} />
          ) : (
            <GraduationCap size={21} />
          )}
        </span>
        <span className="rating-policy-title">
          <strong>
            {blocked
              ? `Бронирование заблокировано до ${formatDate(profile.blockedUntil!)}`
              : student
                ? 'Рейтинг ученика'
                : 'Профиль преподавателя'}
          </strong>
          <span>Правила бронирования и отмены</span>
        </span>
        <span className="rating-policy-score">
          {student
            ? `${formatRating(profile.rating)} баллов`
            : 'Без ограничений'}
        </span>
        <ChevronDown size={18} className="rating-policy-chevron" />
      </summary>
      <div className="rating-policy-body">
        {student ? (
          <ul>
            <li>Завершённая бронь: +{COMPLETED_BOOKING_REWARD} балл.</li>
            <li>Отмена более чем за 2 часа до начала: без штрафа.</li>
            <li>
              Одна поздняя отмена в месяц — бесплатно.{' '}
              {freeCancellations
                ? 'В этом месяце доступна.'
                : 'В этом месяце уже использована.'}
            </li>
            <li>Следующие поздние отмены: {CANCEL_BOOKING_PENALTY} балла.</li>
            <li>
              При рейтинге {RATING_BLOCK_THRESHOLD} и ниже бронирование
              блокируется на {RATING_BLOCK_DAYS} дней.
            </li>
          </ul>
        ) : (
          <p>
            Рейтинг не начисляется и не ограничивает бронирование преподавателя.
          </p>
        )}
        <p className="rating-policy-responsibility">
          Один аккаунт — один активный коворкинг. Один коворкинг — один
          ответственный на выбранное время.
        </p>
      </div>
    </details>
  );
}
