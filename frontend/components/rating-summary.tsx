'use client';

import { GraduationCap, Star } from 'lucide-react';
import { formatRating, useUserProfile } from '@/lib/account';

export function RatingSummary({ compact = false }: { compact?: boolean }) {
  const { profile } = useUserProfile();
  return (
    <div
      className={`rating-summary${compact ? ' rating-summary-compact' : ''}`}
    >
      <span className="rating-summary-icon">
        {profile.role === 'student' ? (
          <Star size={18} />
        ) : (
          <GraduationCap size={18} />
        )}
      </span>
      <span className="rating-summary-label">Рейтинг</span>
      <strong>
        {profile.role === 'student'
          ? `${formatRating(profile.rating)} баллов`
          : 'Не влияет'}
      </strong>
    </div>
  );
}
