import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Есть место — коворкинги кампуса',
  description:
    'Выберите коворкинг на одном из трёх этажей кампуса. 23 пространства для учёбы, встреч и совместной работы.',
  icons: { icon: '/favicon.svg' },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
