import Link from 'next/link';
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
        <h3 className="mb-1 text-sm font-medium text-fd-muted-foreground">{group.name}</h3>
      ) : null}
      <ul className={group.name ? undefined : 'grid gap-x-8 sm:grid-cols-3'}>
        {links.map((link) => (
          <li key={link.url}>
            <Link
              href={link.url}
              className="-mx-2 flex min-h-11 items-center rounded-md px-2 text-[0.9375rem] transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground sm:min-h-9"
            >
              {link.name}
            </Link>
          </li>
        ))}
        {hidden > 0 ? (
          <li>
            <Link
              href={areaUrl}
              className="-mx-2 flex min-h-11 items-center rounded-md px-2 text-[0.9375rem] text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground sm:min-h-9"
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
    <main className="mx-auto w-full max-w-(--fd-layout-width) flex-1 px-4 pb-16 pt-10 sm:pt-16">
      <header className="max-w-2xl">
        <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">{appName}</h1>
        <p className="mt-3 text-pretty text-fd-muted-foreground">{appDescription}</p>
        <div className="mt-6">
          <SearchButton />
        </div>
      </header>

      <div className="mt-12 sm:mt-16">
        {areas.map((area) => (
          <section
            key={area.url}
            className="grid gap-x-10 gap-y-5 border-t py-8 lg:grid-cols-[15rem_minmax(0,1fr)]"
          >
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                <Link
                  href={area.url}
                  className="inline-flex items-center gap-2.5 transition-colors hover:text-fd-primary"
                >
                  <span className="text-fd-primary [&_svg]:size-5">{area.icon}</span>
                  {area.name}
                </Link>
              </h2>
              {area.description ? (
                <p className="mt-1.5 text-sm text-fd-muted-foreground">{area.description}</p>
              ) : null}
            </div>
            <div className="grid gap-x-8 gap-y-6 sm:grid-cols-3">
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
