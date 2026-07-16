'use client';

import { App, ConfigProvider } from 'antd';
import enUS from 'antd/locale/en_US';
import faIR from 'antd/locale/fa_IR';
import { useMemo, type ReactNode } from 'react';
import { useLocale } from '@/i18n/LocaleProvider';
import { PERSIAN_FONT_STACK } from '@/lib/fonts';
import { DayjsCalendarSync } from './DayjsCalendarSync';
import { antdTheme } from './theme';

const antdLocales = {
  en: enUS,
  fa: faIR,
};

export function AntdProvider({ children }: { children: ReactNode }) {
  const { locale, dir } = useLocale();

  const theme = useMemo(
    () => ({
      ...antdTheme,
      token: {
        ...antdTheme.token,
        fontFamily: locale === 'fa' ? PERSIAN_FONT_STACK : 'inherit',
      },
    }),
    [locale],
  );

  return (
    <ConfigProvider direction={dir} locale={antdLocales[locale]} theme={theme}>
      <DayjsCalendarSync />
      <App>{children}</App>
    </ConfigProvider>
  );
}
