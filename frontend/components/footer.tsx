import type { Translation } from '@/lib/translations';

interface FooterProps {
  t: Translation;
}

export function Footer({ t }: FooterProps) {
  return (
    <footer id="site-footer" className="footer">
      <span>{t.footerQuote}</span>
      <span>
        <span className="footer-dot" />
        {t.campusHours}
      </span>
    </footer>
  );
}
