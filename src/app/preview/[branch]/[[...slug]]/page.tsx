import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { DocsPageView } from '@/components/docs-page';
import { getPreviewDocs } from '@/lib/source';

type Props = PageProps<'/preview/[branch]/[[...slug]]'>;

async function getPage(props: Props) {
  const { branch, slug } = await props.params;
  const docs = await getPreviewDocs(decodeURIComponent(branch));
  if (!docs) notFound();

  return { docs, slug, page: docs.source.getPage(slug) };
}

export default async function Page(props: Props) {
  const { docs, slug, page } = await getPage(props);
  if (!page && !slug) {
    const first = docs.source.getPages()[0];
    if (first) redirect(first.url);
  }
  if (!page) notFound();

  return <DocsPageView docs={docs} page={page} />;
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { page } = await getPage(props);
  if (!page) return {};

  return {
    title: `${page.data.title} (pré-visualização)`,
    description: page.data.description,
  };
}
