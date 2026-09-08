'use client';
import { useState } from 'react';
import type { UserRole } from '@/lib/account';
import { setUserRole } from '@/lib/account';

export function RoleSelect({
  id,
  value,
  labels = { student: 'Ученик', teacher: 'Преподаватель' },
  interactive = true,
  onChange,
}: {
  id: string;
  value: UserRole;
  labels?: { student: string; teacher: string };
  interactive?: boolean;
  onChange?: (role: UserRole) => void;
}) {
  const [pending, setPending] = useState(false);

  if (!interactive) {
    return <span id={id} className="role-select inline-flex items-center px-3 text-sm">{labels[value]}</span>;
  }

  const handleSelect = async (newRole: UserRole) => {
    if (newRole === value || pending) return;
    setPending(true);
    try {
      if (onChange) {
        onChange(newRole);
      } else {
        await setUserRole(newRole);
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <div
      id={id}
      aria-label="Выбор роли"
      className="inline-flex p-1 rounded-xl bg-muted border border-border text-xs font-semibold"
    >
      <button
        type="button"
        aria-pressed={value === 'student'}
        disabled={pending}
        onClick={() => void handleSelect('student')}
        className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
          value === 'student'
            ? 'bg-card text-primary shadow-xs font-bold'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        {labels.student}
      </button>
      <button
        type="button"
        aria-pressed={value === 'teacher'}
        disabled={pending}
        onClick={() => void handleSelect('teacher')}
        className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
          value === 'teacher'
            ? 'bg-card text-primary shadow-xs font-bold'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        {labels.teacher}
      </button>
    </div>
  );
}

