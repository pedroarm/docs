import { createFromSource } from 'fumadocs-core/search/server';
import { getDocs } from '@/lib/source';

// re-indexes whenever the published content changes, since that produces a new source
export const { GET } = createFromSource(async () => (await getDocs()).source);
