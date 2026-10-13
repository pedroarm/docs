import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { Banner } from 'fumadocs-ui/components/banner';
import { baseOptions } from '@/lib/layout';
import { getPreviewDocs } from '@/lib/source';

// previews show unreviewed content, keep them out of search engines
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function Layout({ children, params }: LayoutProps<'/preview/[branch]'>) {
  const branch = decodeURIComponent((await params).branch);
  const docs = await getPreviewDocs(branch);
  if (!docs) notFound();

  return (
    <>
      <Banner>
        Pré-visualização da branch <code className="mx-1 font-mono">{branch}</code>, ainda não publicada.
      </Banner>
      <DocsLayout
        tree={docs.source.getPageTree()}
        {...baseOptions()}
        // the search index only covers published content
        searchToggle={{ enabled: false }}
      >
        {children}
      </DocsLayout>
    </>
  );
}
