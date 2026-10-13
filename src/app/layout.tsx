import type { Metadata } from 'next';
import { RootProvider } from 'fumadocs-ui/provider/next';
import { Inter } from 'next/font/google';
import { appDescription, appName } from '@/lib/config';
import { translations } from '@/lib/translations';
import './global.css';

const inter = Inter({
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: { default: appName, template: `%s | ${appName}` },
  description: appDescription,
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="pt-BR" className={inter.className} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <RootProvider i18n={{ locale: 'pt-BR', translations }}>{children}</RootProvider>
      </body>
    </html>
  );
}
