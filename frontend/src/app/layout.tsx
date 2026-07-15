import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import '@fontsource/vazir/400.css';
import '@fontsource/vazir/500.css';
import '@fontsource/vazir/700.css';
import { Providers } from './providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? 'Planora';

export const metadata: Metadata = {
  title: {
    default: appName,
    template: '%s | Planora',
  },
  description:
    'Manage projects, tasks, and teams with Kanban boards and real-time collaboration.',
  keywords: [
    'Planora',
    'project management',
    'kanban',
    'tasks',
    'collaboration',
  ],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: appName,
  },
  icons: {
    apple: '/logo.webp',
  },
};

export const viewport: Viewport = {
  themeColor: '#111827',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var m=document.cookie.match(/(?:^|; )app-locale=([^;]*)/);var locale=m?decodeURIComponent(m[1]):'en';var isFa=locale==='fa';document.documentElement.classList.add(isFa?'locale-fa':'locale-en');if(isFa){document.documentElement.setAttribute('dir','rtl');document.documentElement.setAttribute('lang','fa');}else{document.documentElement.setAttribute('dir','ltr');document.documentElement.setAttribute('lang','en');}}catch(e){}})();`,
          }}
        />
      </head>
      <body className={inter.className}>
        <AntdRegistry>
          <Providers>{children}</Providers>
        </AntdRegistry>
      </body>
    </html>
  );
}
