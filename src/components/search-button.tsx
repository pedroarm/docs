'use client';

import { Search } from 'lucide-react';
import { useSearchContext } from 'fumadocs-ui/contexts/search';

export function SearchButton() {
  const { setOpenSearch } = useSearchContext();

  return (
    <button
      type="button"
      onClick={() => setOpenSearch(true)}
      className="flex w-full items-center gap-3 rounded-xl border bg-fd-card px-4 py-3.5 text-left text-fd-muted-foreground shadow-sm transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground"
    >
      <Search className="size-5 shrink-0" />
      <span className="flex-1">Buscar na documentação…</span>
      <kbd className="hidden rounded-md border bg-fd-background px-1.5 py-0.5 text-xs font-medium sm:block">
        ⌘ K
      </kbd>
    </button>
  );
}
