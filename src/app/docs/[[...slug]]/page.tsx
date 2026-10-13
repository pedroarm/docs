import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { DocsPageView } from '@/components/docs-page';
import { getDocs } from '@/lib/source';

export default async function Page(props: PageProps<'/docs/[[...slug]]'>) {
  const { slug } = await props.params;
  const docs = await getDocs();
  const page = docs.source.getPage(slug);
  // the areas are listed on the home page, there is no page for the docs root itself
  if (!page && !slug) redirect('/');
  if (!page) notFound();

  return <DocsPageView docs={docs} page={page} />;
}

export async function generateStaticParams() {
  return (await getDocs()).source.generateParams();
}

export async function generateMetadata(props: PageProps<'/docs/[[...slug]]'>): Promise<Metadata> {
  const { slug } = await props.params;
  const page = (await getDocs()).source.getPage(slug);
  if (!page) return {};

  return {
    title: page.data.title,
    description: page.data.description,
  };
}
