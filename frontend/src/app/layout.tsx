import type { Metadata, Viewport } from 'next';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { BRAND_NAME } from '@/lib/page-metadata';
import { inter, VAZIRMATN_PRELOAD_WEIGHTS } from '@/lib/fonts';
import { getServerLocale } from '@/i18n/server';
import { getLocaleDirection } from '@/i18n/types';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  applicationName: BRAND_NAME,
  title: {
    default: BRAND_NAME,
    template: `${BRAND_NAME} | %s`,
  },
  description:
    'Planora — manage projects, tasks, and teams with Kanban boards and real-time collaboration.',
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
    title: BRAND_NAME,
  },
  openGraph: {
    siteName: BRAND_NAME,
    title: BRAND_NAME,
  },
  icons: {
    apple: '/planora-logo.webp',
  },
};

export const viewport: Viewport = {
  themeColor: '#111827',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getServerLocale();
  const isFa = locale === 'fa';
  const dir = getLocaleDirection(locale);

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${inter.variable} ${isFa ? 'locale-fa' : 'locale-en'}`}
      suppressHydrationWarning
    >
      <head>
        {isFa
          ? VAZIRMATN_PRELOAD_WEIGHTS.map((weight) => (
              <link
                key={weight}
                rel="preload"
                href={`/vazir/Vazirmatn-${weight}.woff2`}
                as="font"
                type="font/woff2"
                crossOrigin="anonymous"
              />
            ))
          : null}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var m=document.cookie.match(/(?:^|; )app-locale=([^;]*)/);var locale=m?decodeURIComponent(m[1]):'en';var isFa=locale==='fa';document.documentElement.classList.remove('locale-en','locale-fa');document.documentElement.classList.add(isFa?'locale-fa':'locale-en');if(isFa){document.documentElement.setAttribute('dir','rtl');document.documentElement.setAttribute('lang','fa');var weights=['Regular','Medium','Bold'];for(var i=0;i<weights.length;i++){var w=weights[i];if(document.querySelector('link[rel="preload"][href="/vazir/Vazirmatn-'+w+'.woff2"]'))continue;var l=document.createElement('link');l.rel='preload';l.as='font';l.type='font/woff2';l.crossOrigin='anonymous';l.href='/vazir/Vazirmatn-'+w+'.woff2';document.head.appendChild(l);}}else{document.documentElement.setAttribute('dir','ltr');document.documentElement.setAttribute('lang','en');}}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <AntdRegistry>
          <Providers>{children}</Providers>
        </AntdRegistry>
      </body>
    </html>
  );
}
