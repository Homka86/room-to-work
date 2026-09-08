import Link from 'next/link';
import { DoorOpen, Globe, Moon, Sun, Info, UserRound } from 'lucide-react';
import { getRoomCode, type Language, type Translation } from '@/lib/translations';
import type { UserBooking } from '@/lib/bookings';
import type { UserRole } from '@/lib/account';

interface HeaderTopBarProps {
  lang: Language;
  theme: 'light' | 'dark';
  t: Translation;
  activeBooking?: UserBooking | null;
  onToggleLanguage: () => void;
  onToggleTheme: () => void;
  onOpenMyBookings?: () => void;
  onOpenUser?: () => void;
  onOpenAdditionalInfo: () => void;
  role?: UserRole;
}

export function HeaderTopBar({
  lang,
  theme,
  t,
  activeBooking,
  onToggleLanguage,
  onToggleTheme,
  onOpenMyBookings,
  onOpenUser,
  onOpenAdditionalInfo,
}: HeaderTopBarProps) {
  const handleOpenUser = onOpenUser || onOpenMyBookings || (() => {});

  return (
    <header id="site-topbar" className="topbar">
      <Link id="brand-logo-link" href="/" className="brand" aria-label={t.brand}>
        <span className="brand-icon">
          <DoorOpen size={24} strokeWidth={2.4} />
        </span>
        <span>{t.brand}</span>
      </Link>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        {/* 1. Theme switch button */}
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

        {/* 2. Language switch button */}
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

        {/* 3. Additional info button */}
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

        {/* 4. User profile & bookings button */}
        <button
          id="header-user-button"
          type="button"
          onClick={handleOpenUser}
          className="relative inline-flex items-center justify-center w-9 h-9 rounded-xl border border-border bg-card text-foreground hover:bg-muted hover:text-primary transition-all cursor-pointer shadow-xs focus-visible:outline-2 focus-visible:outline-primary"
          title={
            activeBooking
              ? `${t.user} (${getRoomCode(activeBooking.roomNumber, lang)})`
              : t.user
          }
          aria-label={t.user}
        >
          <UserRound size={17} />
          {activeBooking ? (
            <span
              id="header-active-booking-pill"
              className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-card animate-pulse"
              title={`${t.bookedByMe}: ${getRoomCode(activeBooking.roomNumber, lang)}`}
            />
          ) : null}
        </button>
      </div>
    </header>
  );
}
