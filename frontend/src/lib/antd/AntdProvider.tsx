'use client';

import { App, ConfigProvider } from 'antd';
import type { ReactNode } from 'react';
import { antdTheme } from './theme';

export function AntdProvider({ children }: { children: ReactNode }) {
  return (
    <ConfigProvider theme={antdTheme}>
      <App>{children}</App>
    </ConfigProvider>
  );
}
