import { HomeLayout } from 'fumadocs-ui/layouts/home';
import type { LinkItemType } from 'fumadocs-ui/layouts/shared';
import { getAreas } from '@/lib/areas';
import { baseOptions } from '@/lib/layout';
import { getDocs } from '@/lib/source';

export default async function Layout({ children }: LayoutProps<'/'>) {
  const { source } = await getDocs();
  // same areas, in the same place, as the tabs of the docs header
  const links = getAreas(source.getPageTree()).map(
    (area): LinkItemType => ({ text: area.name, url: area.url, active: 'nested-url' }),
  );

  return (
    <HomeLayout {...baseOptions()} links={links}>
      {children}
    </HomeLayout>
  );
}
