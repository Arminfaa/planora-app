'use client';

import { Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { LOCALES, type Locale } from '../types';
import { useLocale } from '../LocaleProvider';

interface LocaleSwitcherProps {
  className?: string;
  compact?: boolean;
}

function GlobeIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
      />
    </svg>
  );
}

export function LocaleSwitcher({
  className = '',
  compact = true,
}: LocaleSwitcherProps) {
  const { locale, setLocale, t } = useLocale();

  const items: MenuProps['items'] = LOCALES.map((code) => ({
    key: code,
    label: t(`locale.${code}`),
  }));

  const onClick: MenuProps['onClick'] = ({ key }) => {
    setLocale(key as Locale);
  };

  const currentLabel = t(`locale.${locale}`);

  return (
    <Dropdown
      menu={{ items, onClick, selectedKeys: [locale] }}
      trigger={['click']}
      placement="bottomRight"
    >
      <button
        type="button"
        aria-label={t('locale.switchLanguage')}
        title={t('locale.switchLanguage')}
        className={`inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 ${className}`}
      >
        <GlobeIcon />
        {compact ? (
          <span className="uppercase tracking-wide">{locale}</span>
        ) : (
          <span>{currentLabel}</span>
        )}
      </button>
    </Dropdown>
  );
}
