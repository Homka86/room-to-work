'use client';

import { GraduationCap, Star } from 'lucide-react';
import { formatRating, useUserProfile } from '@/lib/account';
import { useCampusPreferences } from '@/hooks/use-campus-preferences';

export function RatingSummary({ compact = false }: { compact?: boolean }) {
  const { profile } = useUserProfile();
  const { t, lang } = useCampusPreferences();
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
      <span className="rating-summary-label">{t.ratingLabel}</span>
      <strong>
        {profile.role === 'student'
          ? `${formatRating(profile.rating)} ${lang === 'ru' ? (profile.rating === 1 ? 'балл' : 'баллов') : profile.rating === 1 ? 'point' : 'points'}`
          : t.roleTeacher}
      </strong>
    </div>
  );
}
