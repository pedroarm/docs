import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { SearchButton } from '@/components/search-button';
import { getAreas, type AreaGroup } from '@/lib/areas';
import { appDescription, appName } from '@/lib/config';
import { getDocs } from '@/lib/source';

/** long sections stay scannable, the rest is one tap away in the area itself */
const maxLinks = 6;

function Group({ group, areaUrl }: { group: AreaGroup; areaUrl: string }) {
  const links = group.links.slice(0, maxLinks);
  const hidden = group.links.length - links.length;

  return (
    // pages that sit directly in the area have no section title, so they flow across the row instead of one column
    <div className={group.name ? 'min-w-0' : 'min-w-0 sm:col-span-3'}>
      {group.name ? (
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-fd-muted-foreground">{group.name}</h3>
      ) : null}
      <ul className={group.name ? undefined : 'grid gap-x-8 sm:grid-cols-3'}>
        {links.map((link) => (
          <li key={link.url}>
            <Link
              href={link.url}
              className="-mx-2 flex min-h-11 items-center rounded-lg px-2 text-[0.9375rem] transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground"
            >
              {link.name}
            </Link>
          </li>
        ))}
        {hidden > 0 ? (
          <li>
            <Link
              href={areaUrl}
              className="-mx-2 flex min-h-11 items-center rounded-lg px-2 text-[0.9375rem] text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground"
            >
              Mais {hidden} {hidden === 1 ? 'página' : 'páginas'}
            </Link>
          </li>
        ) : null}
      </ul>
    </div>
  );
}

export default async function HomePage() {
  const { source } = await getDocs();
  const areas = getAreas(source.getPageTree());

  return (
    <main className="mx-auto w-full max-w-(--fd-layout-width) flex-1 px-5 pb-20 pt-12 sm:px-8 sm:pt-20">
      <header className="max-w-3xl">
        <h1 className="editorial-title text-balance text-[2.5rem] sm:text-5xl">{appName}</h1>
        <p className="mt-5 max-w-2xl text-pretty leading-relaxed text-fd-muted-foreground">{appDescription}</p>
        <div className="mt-8 max-w-xl">
          <SearchButton />
        </div>
      </header>

      <div className="mt-14 border-b border-fd-border sm:mt-20">
        {areas.map((area) => (
          <section
            key={area.url}
            className="grid gap-x-12 gap-y-7 border-t border-fd-border py-8 sm:py-10 lg:grid-cols-[16rem_minmax(0,1fr)]"
          >
            <div>
              <h2 className="text-xl font-medium tracking-tight">
                <Link
                  href={area.url}
                  className="group inline-flex min-h-11 items-center gap-3 transition-colors hover:text-fd-primary"
                >
                  <span className="text-fd-primary [&_svg]:size-5">{area.icon}</span>
                  {area.name}
                  <ArrowUpRight aria-hidden="true" className="size-4 text-fd-muted-foreground" />
                </Link>
              </h2>
              {area.description ? (
                <p className="mt-1.5 text-sm text-fd-muted-foreground">{area.description}</p>
              ) : null}
            </div>
            <div className="grid min-w-0 gap-x-8 gap-y-7 sm:grid-cols-3">
              {area.groups.map((group, i) => (
                <Group key={i} group={group} areaUrl={area.url} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
