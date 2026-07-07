import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { Providers } from './providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

const appName =
  process.env.NEXT_PUBLIC_APP_NAME ?? 'Project Management Platform';

export const metadata: Metadata = {
  title: {
    default: appName,
    template: '%s | Project Management',
  },
  description:
    'Manage projects, tasks, and teams with Kanban boards and real-time collaboration.',
  keywords: ['project management', 'kanban', 'tasks', 'collaboration'],
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
      <body className={inter.className}>
        <AntdRegistry>
          <Providers>{children}</Providers>
        </AntdRegistry>
      </body>
    </html>
  );
}
