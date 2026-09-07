'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  Building2,
  Clock3,
  DoorOpen,
  Home,
  Info,
  Layers3,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RoleSelect } from '@/components/role-select';
import { useUserProfile } from '@/lib/account';
import { AdditionalInfoDialog } from '@/components/additional-info-dialog';

type SiteShellProps = {
  children: ReactNode;
  section?: 'rooms' | 'bookings';
  onOpenBookings?: () => void;
  bookedRoomNumber?: string;
};

function SiteHeader({
  onOpenBookings,
  bookedRoomNumber,
}: Pick<SiteShellProps, 'onOpenBookings' | 'bookedRoomNumber'>) {
  const { profile } = useUserProfile();
  return (
    <>
      <div className="university-strip">
        <nav aria-label="Сайты университета">
          <a href="https://urfu.ru/" target="_blank" rel="noreferrer">
            <Home size={13} /> Портал УрФУ
          </a>
          <ArrowRight size={12} />
          <a href="https://istudent.urfu.ru/" target="_blank" rel="noreferrer">
            Личный кабинет
          </a>
          <ArrowRight size={12} />
          <span>Есть место</span>
        </nav>
        <span className="university-strip-label">
          Уральский федеральный университет
        </span>
      </div>
      <header id="site-topbar" className="university-header">
        <a
          className="university-logo"
          href="https://istudent.urfu.ru/"
          target="_blank"
          rel="noreferrer"
          aria-label="Личный кабинет студента УрФУ"
        >
          {/* A local SVG needs no optimization; avoid the framework image shim. */}
          {/* oxlint-disable-next-line next/no-img-element */}
          <img
            src="/urfu-logo.svg"
            alt="Уральский федеральный университет"
            width={213}
            height={94}
          />
        </a>
        <Link
          id="brand-logo-link"
          href="/"
          className="project-brand"
          aria-label="Есть место — главная"
        >
          <strong>Есть место</strong>
          <span>Бронирование учебных пространств</span>
        </Link>
        <div className="university-header-actions">
          <RoleSelect
            id="header-role-select"
            value={profile.role}
          />
          {onOpenBookings ? (
            <Button
              id="header-my-bookings-button"
              size="lg"
              className="header-bookings"
              onClick={onOpenBookings}
            >
              <Bookmark size={17} />
              <span>Мои бронирования</span>
              {bookedRoomNumber !== undefined && (
                <span className="header-booking-count">
                  К{bookedRoomNumber}
                </span>
              )}
            </Button>
          ) : (
            <Button
              render={<Link href="/" />}
              size="lg"
              className="header-bookings"
            >
              <DoorOpen size={17} /> Забронировать
            </Button>
          )}
        </div>
      </header>
    </>
  );
}

function CampusSidebar({
  section,
  onOpenBookings,
  onOpenAdditionalInfo,
}: Pick<SiteShellProps, 'section' | 'onOpenBookings'> & {
  onOpenAdditionalInfo: () => void;
}) {
  return (
    <aside className="campus-sidebar" aria-label="Навигация по кампусу">
      <div className="sidebar-panel">
        <h2>
          <Building2 size={21} /> Кампус
        </h2>
        <nav className="campus-navigation" aria-label="Разделы проекта">
          <Link
            href="/"
            className={
              section === 'rooms'
                ? 'campus-nav-item is-current'
                : 'campus-nav-item'
            }
            aria-current={section === 'rooms' ? 'page' : undefined}
          >
            <DoorOpen size={20} />
            <span>Коворкинги</span>
            <span className="nav-count">23</span>
          </Link>
          {onOpenBookings ? (
            <Button
              variant="ghost"
              onClick={onOpenBookings}
              className="campus-nav-item"
            >
              <Bookmark size={20} />
              <span>Мои бронирования</span>
            </Button>
          ) : (
            <Link
              href="/my-bookings"
              className={
                section === 'bookings'
                  ? 'campus-nav-item is-current'
                  : 'campus-nav-item'
              }
              aria-current={section === 'bookings' ? 'page' : undefined}
            >
              <Bookmark size={20} />
              <span>Мои бронирования</span>
            </Link>
          )}
          <Button
            variant="ghost"
            onClick={onOpenAdditionalInfo}
            className="campus-nav-item"
          >
            <Info size={20} />
            <span>Доп. информация</span>
          </Button>
          <a
            href="https://istudent.urfu.ru/"
            target="_blank"
            rel="noreferrer"
            className="campus-nav-item"
          >
            <Users size={20} />
            <span>Личный кабинет</span>
            <ArrowUpRight size={15} />
          </a>
        </nav>
      </div>
      <div className="sidebar-panel campus-info">
        <h3>Пространство для работы</h3>
        <p>
          <Layers3 size={18} />
          <span>3 этажа · 23 коворкинга</span>
        </p>
        <p>
          <Clock3 size={18} />
          <span>Ежедневно 08:00–22:00</span>
        </p>
        <span id="demo-pill-badge" className="campus-demo-label">
          Демо-версия
        </span>
      </div>
    </aside>
  );
}

export function SiteShell({
  children,
  section = 'rooms',
  onOpenBookings,
  bookedRoomNumber,
}: SiteShellProps) {
  const [additionalInfoOpen, setAdditionalInfoOpen] = useState(false);
  return (
    <div id="site-root" className="site-shell">
      <SiteHeader
        onOpenBookings={onOpenBookings}
        bookedRoomNumber={bookedRoomNumber}
      />
      <div className="university-layout">
        <CampusSidebar
          section={section}
          onOpenBookings={onOpenBookings}
          onOpenAdditionalInfo={() => setAdditionalInfoOpen(true)}
        />
        {children}
      </div>
      <footer id="site-footer" className="university-footer">
        <span>Есть место · бронирование учебных пространств</span>
        <a href="https://istudent.urfu.ru/" target="_blank" rel="noreferrer">
          Личный кабинет студента УрФУ <ArrowUpRight size={14} />
        </a>
      </footer>
      <AdditionalInfoDialog
        open={additionalInfoOpen}
        onOpenChange={setAdditionalInfoOpen}
      />
    </div>
  );
}
