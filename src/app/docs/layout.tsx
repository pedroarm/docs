import { DocsLayout } from 'fumadocs-ui/layouts/notebook';
import { docsOptions } from '@/lib/layout';
import { getDocs } from '@/lib/source';

export default async function Layout({ children }: LayoutProps<'/docs'>) {
  const { source } = await getDocs();

  return (
    <DocsLayout tree={source.getPageTree()} {...docsOptions()}>
      {children}
    </DocsLayout>
  );
}
