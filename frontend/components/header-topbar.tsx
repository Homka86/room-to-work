import Link from 'next/link';
import { DoorOpen, Globe, Moon, Sun, Bookmark, Info } from 'lucide-react';
import type { Language, Translation } from '@/lib/translations';
import type { UserBooking } from '@/lib/bookings';
import type { UserRole } from '@/lib/account';
import { RoleSelect } from '@/components/role-select';

interface HeaderTopBarProps {
  lang: Language;
  theme: 'light' | 'dark';
  t: Translation;
  activeBooking?: UserBooking | null;
  onToggleLanguage: () => void;
  onToggleTheme: () => void;
  onOpenMyBookings: () => void;
  onOpenAdditionalInfo: () => void;
  role: UserRole;
}

export function HeaderTopBar({
  lang,
  theme,
  t,
  activeBooking,
  onToggleLanguage,
  onToggleTheme,
  onOpenMyBookings,
  onOpenAdditionalInfo,
  role,
}: HeaderTopBarProps) {
  return (
    <header id="site-topbar" className="topbar">
      <Link id="brand-logo-link" href="/" className="brand" aria-label={t.brand}>
        <span className="brand-icon">
          <DoorOpen size={24} strokeWidth={2.4} />
        </span>
        <span>
          {t.brand}
          <span className="brand-dot">.</span>
        </span>
      </Link>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <RoleSelect
          id="header-role-select"
          value={role}
          labels={{ student: t.roleStudent, teacher: t.roleTeacher }}
        />

        <button
          id="header-additional-info-button"
          type="button"
          onClick={onOpenAdditionalInfo}
          className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-border bg-card text-foreground hover:bg-muted hover:text-primary transition-all cursor-pointer shadow-xs focus-visible:outline-2 focus-visible:outline-primary"
          title={t.additionalInfo}
          aria-label={t.additionalInfo}
        >
          <Info size={17} />
        </button>

        {/* Language icon button */}
        <button
          id="header-language-toggle"
          type="button"
          onClick={onToggleLanguage}
          className="relative inline-flex items-center justify-center w-9 h-9 rounded-xl border border-border bg-card text-foreground hover:bg-muted hover:text-primary transition-all cursor-pointer shadow-xs focus-visible:outline-2 focus-visible:outline-primary"
          title={`${t.languageSwitch} (${lang.toUpperCase()})`}
          aria-label={`${t.languageSwitch}: ${lang.toUpperCase()}`}
        >
          <Globe size={17} />
          <span className="sr-only">{lang.toUpperCase()}</span>
          <span className="absolute -bottom-1 -right-1 text-[9px] font-extrabold uppercase px-1 py-0.2 rounded-full bg-primary/10 text-primary border border-primary/20 leading-none">
            {lang}
          </span>
        </button>

        {/* Theme icon button */}
        <button
          id="header-theme-toggle"
          type="button"
          onClick={onToggleTheme}
          className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-border bg-card text-foreground hover:bg-muted hover:text-primary transition-all cursor-pointer shadow-xs focus-visible:outline-2 focus-visible:outline-primary"
          title={theme === 'dark' ? t.lightTheme : t.darkTheme}
          aria-label={t.themeSwitch}
        >
          {theme === 'dark' ? (
            <Sun size={17} className="text-amber-400" />
          ) : (
            <Moon size={17} className="text-primary" />
          )}
        </button>

        {/* My Bookings icon button */}
        <button
          id="header-my-bookings-button"
          type="button"
          onClick={onOpenMyBookings}
          className="relative inline-flex items-center justify-center w-9 h-9 rounded-xl border border-[#dfd6f2] dark:border-[#383353] bg-[#fbf9fe] dark:bg-[#232036] text-[#7560da] dark:text-[#a896f6] hover:bg-[#f3edf9] dark:hover:bg-[#2a2642] transition-all cursor-pointer shadow-xs focus-visible:outline-2 focus-visible:outline-primary"
          title={
            activeBooking
              ? `${t.myBookings} (К${activeBooking.roomNumber})`
              : t.myBookings
          }
          aria-label={t.myBookings}
        >
          <Bookmark size={17} />
          {activeBooking ? (
            <span
              id="header-active-booking-pill"
              className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-card animate-pulse"
              title={`${t.bookedByMe}: К${activeBooking.roomNumber}`}
            />
          ) : null}
        </button>
      </div>
    </header>
  );
}
