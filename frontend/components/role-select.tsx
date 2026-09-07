'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { UserRole } from '@/lib/account';

export function RoleSelect({
  id,
  value,
  onChange,
  labels = { student: 'Ученик', teacher: 'Преподаватель' },
}: {
  id: string;
  value: UserRole;
  onChange: (role: UserRole) => void;
  labels?: { student: string; teacher: string };
}) {
  return (
    <Select
      value={value}
      onValueChange={(role) => {
        if (role === 'student' || role === 'teacher') onChange(role);
      }}
    >
      <SelectTrigger
        id={id}
        className="role-select"
        aria-label="Роль пользователя"
      >
      <SelectValue>
          {value === 'student' ? labels.student : labels.teacher}
      </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="student">{labels.student}</SelectItem>
        <SelectItem value="teacher">{labels.teacher}</SelectItem>
      </SelectContent>
    </Select>
  );
}
