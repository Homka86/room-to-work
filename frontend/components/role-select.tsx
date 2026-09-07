'use client';
import type { UserRole } from '@/lib/account';
export function RoleSelect({ id, value, labels = { student: 'Ученик', teacher: 'Преподаватель' } }: {
  id: string; value: UserRole; labels?: { student: string; teacher: string };
}) {
  return <span id={id} className="role-select inline-flex items-center px-3 text-sm">{labels[value]}</span>;
}
