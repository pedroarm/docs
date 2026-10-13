import { cache } from 'react';
import { dynamicLoader } from 'fumadocs-core/source/dynamic';
import type { MetaData, PageData, VirtualFile } from 'fumadocs-core/source';
import { lucideIconsPlugin } from 'fumadocs-core/source/lucide-icons';
import { frontmatter } from 'fumadocs-core/content/md/frontmatter';
import type { StructuredData } from 'fumadocs-core/mdx-plugins';
import { contentRepo, docsRoute, localContentDir, previewRoute } from './config';
import { compile, type CompiledPage } from './content/compile';
import {
  getBranchHead,
  getGithubLastEdit,
  getGithubSnapshot,
  getPublishedHead,
} from './content/github';
import { getLocalLastEdit, getLocalSnapshot } from './content/local';
import type { ContentFile, ContentSnapshot } from './content/types';
import { remember } from './lru';

export interface DocsPageData extends PageData {
  title: string;
  description?: string;
  /** hide the table of contents and use the full width */
  full?: boolean;
  file: ContentFile;
  /** markdown without frontmatter */
  markdown: string;
  load: () => Promise<CompiledPage>;
  structuredData: () => Promise<StructuredData>;
}

type Config = { pageData: DocsPageData; metaData: MetaData };

function text(value: unknown) {
  return typeof value === 'string' && value.trim() !== '' ? value : undefined;
}

/** Read a `meta.json`, keeping only the fields we support and only when they have the expected type. */
function parseMeta(content: string): MetaData | undefined {
  let json: unknown;
  try {
    json = JSON.parse(content);
  } catch {
    return undefined;
  }
  if (typeof json !== 'object' || json === null || Array.isArray(json)) return undefined;

  const raw = json as Record<string, unknown>;
  const flag = (value: unknown) => (typeof value === 'boolean' ? value : undefined);
  const pages = Array.isArray(raw.pages) ? raw.pages.filter((item) => typeof item === 'string') : undefined;

  return {
    title: text(raw.title),
    description: text(raw.description),
    icon: text(raw.icon),
    root: flag(raw.root),
    defaultOpen: flag(raw.defaultOpen),
    collapsible: flag(raw.collapsible),
    pages,
  };
}

function titleFromPath(path: string) {
  const name = path.split('/').at(-1)!.replace(/\.mdx?$/, '');
  return name.charAt(0).toUpperCase() + name.slice(1).replaceAll('-', ' ');
}

function toVirtualFiles(snapshot: ContentSnapshot): VirtualFile<Config>[] {
  const out: VirtualFile<Config>[] = [];

  for (const file of snapshot.files) {
    if (file.path.endsWith('.json')) {
      // an invalid meta.json should not take the whole site down, the folder falls back to defaults
      const data = parseMeta(file.content);
      if (data) out.push({ type: 'meta', path: file.path, data });
      continue;
    }

    let data: Record<string, unknown> = {};
    let markdown = file.content;
    try {
      const parsed = frontmatter(file.content);
      markdown = parsed.content;
      if (parsed.data && typeof parsed.data === 'object') data = parsed.data as typeof data;
    } catch {
      // invalid frontmatter: render the file as-is so the author can see what is wrong
    }

    let compiled: Promise<CompiledPage> | undefined;
    const load = () =>
      (compiled ??= compile({ path: file.path, content: markdown, resolveAsset: snapshot.assetUrl }));

    out.push({
      type: 'page',
      path: file.path,
      data: {
        title: text(data.title) ?? titleFromPath(file.path),
        description: text(data.description),
        icon: text(data.icon),
        full: data.full === true,
        file,
        markdown,
        load,
        structuredData: async () => {
          try {
            return (await load()).structuredData;
          } catch {
            return { headings: [], contents: [] };
          }
        },
      },
    });
  }

  return out;
}

function createDocs(baseUrl: string, getSnapshot: () => Promise<ContentSnapshot>) {
  // the same array must be returned while the content is unchanged, the loader compares it to skip re-computing
  const files = new WeakMap<ContentSnapshot, VirtualFile<Config>[]>();
  let current: ContentSnapshot | undefined;

  const loader = dynamicLoader(
    {
      cache: 'custom',
      async files() {
        const snapshot = (current = await getSnapshot());
        let out = files.get(snapshot);
        if (!out) files.set(snapshot, (out = toVirtualFiles(snapshot)));
        return out;
      },
    },
    { baseUrl, plugins: [lucideIconsPlugin()] },
  );

  return async () => {
    const source = await loader.get();
    return { source, snapshot: current! };
  };
}

export type Docs = Awaited<ReturnType<ReturnType<typeof createDocs>>> & {
  /** branch being rendered, undefined when reading a local checkout */
  branch?: string;
  preview: boolean;
};
export type DocsSource = Docs['source'];
export type DocsPage = NonNullable<ReturnType<DocsSource['getPage']>>;

async function publishedSnapshot() {
  if (localContentDir) return getLocalSnapshot(localContentDir);
  return getGithubSnapshot(await getPublishedHead());
}

const published = createDocs(docsRoute, publishedSnapshot);

/** The published documentation. */
export const getDocs = cache(async (): Promise<Docs> => {
  return {
    ...(await published()),
    branch: localContentDir ? undefined : contentRepo.branch,
    preview: false,
  };
});

class BranchNotFound extends Error {}

const previews = new Map<string, ReturnType<typeof createDocs>>();

export function previewUrl(branch: string) {
  return `${previewRoute}/${encodeURIComponent(branch)}`;
}

/** The documentation as it is on another branch of the content repo, `null` if there is no such branch. */
export const getPreviewDocs = cache(async (branch: string): Promise<Docs | null> => {
  if (localContentDir) return null;

  const docs = remember(previews, branch, 8, () =>
    createDocs(previewUrl(branch), async () => {
      const head = await getBranchHead(branch);
      if (!head) throw new BranchNotFound();
      return getGithubSnapshot(head);
    }),
  );

  try {
    return { ...(await docs()), branch, preview: true };
  } catch (error) {
    if (!(error instanceof BranchNotFound)) throw error;
    previews.delete(branch);
    return null;
  }
});

export function getLastEdit(docs: Docs, page: DocsPage): Promise<Date | null> {
  if (localContentDir) return getLocalLastEdit(localContentDir, page.data.file);
  return getGithubLastEdit(docs.branch!, page.data.file);
}
