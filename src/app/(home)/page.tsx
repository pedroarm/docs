import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { Folder } from 'fumadocs-core/page-tree';
import { SearchButton } from '@/components/search-button';
import { appDescription, appName } from '@/lib/config';
import { getDocs } from '@/lib/source';

function firstUrl(folder: Folder): string | undefined {
  if (folder.index) return folder.index.url;

  for (const child of folder.children) {
    if (child.type === 'page') return child.url;
    if (child.type === 'folder') {
      const url = firstUrl(child);
      if (url) return url;
    }
  }
}

export default async function HomePage() {
  const { source } = await getDocs();
  const areas = source
    .getPageTree()
    .children.filter((node) => node.type === 'folder')
    .map((folder) => ({ folder, url: firstUrl(folder) }))
    .filter((area) => area.url !== undefined);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-10 sm:py-16">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{appName}</h1>
        <p className="text-fd-muted-foreground">{appDescription}</p>
      </header>

      <SearchButton />

      <nav aria-label="Áreas" className="grid gap-3 sm:grid-cols-2">
        {areas.map(({ folder, url }) => (
          <Link
            key={url}
            href={url!}
            className="group flex flex-col gap-2 rounded-xl border bg-fd-card p-4 transition-colors hover:border-fd-primary/50 hover:bg-fd-accent/50"
          >
            <span className="flex items-center gap-2 font-medium">
              <span className="text-fd-primary [&_svg]:size-5">{folder.icon}</span>
              {folder.name}
              <ArrowRight className="ml-auto size-4 text-fd-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </span>
            {folder.description ? (
              <span className="text-sm text-fd-muted-foreground">{folder.description}</span>
            ) : null}
          </Link>
        ))}
      </nav>
    </main>
  );
}
