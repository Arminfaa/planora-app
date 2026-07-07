'use client';

import { App, ConfigProvider } from 'antd';
import enUS from 'antd/locale/en_US';
import faIR from 'antd/locale/fa_IR';
import type { ReactNode } from 'react';
import { useLocale } from '@/i18n/LocaleProvider';
import { antdTheme } from './theme';

const antdLocales = {
  en: enUS,
  fa: faIR,
};

export function AntdProvider({ children }: { children: ReactNode }) {
  const { locale, dir } = useLocale();

  return (
    <ConfigProvider
      direction={dir}
      locale={antdLocales[locale]}
      theme={antdTheme}
    >
      <App>{children}</App>
    </ConfigProvider>
  );
}
