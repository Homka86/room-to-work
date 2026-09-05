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
}: {
  id: string;
  value: UserRole;
  onChange: (role: UserRole) => void;
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
          {value === 'student' ? 'Ученик' : 'Преподаватель'}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="student">Ученик</SelectItem>
        <SelectItem value="teacher">Преподаватель</SelectItem>
      </SelectContent>
    </Select>
  );
}
