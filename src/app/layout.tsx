import type { Metadata } from 'next';
import { RootProvider } from 'fumadocs-ui/provider/next';
import { appDescription, appName } from '@/lib/config';
import { translations } from '@/lib/translations';
import './global.css';

export const metadata: Metadata = {
  title: { default: appName, template: `%s | ${appName}` },
  description: appDescription,
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <RootProvider i18n={{ locale: 'pt-BR', translations }}>{children}</RootProvider>
      </body>
    </html>
  );
}
