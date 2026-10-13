import { contentRepo, contentRoot, contentTag } from '@/lib/config';
import { remember } from '@/lib/lru';
import { isContentFile, type ContentFile, type ContentSnapshot } from './types';

const api = 'https://api.github.com';
const raw = 'https://raw.githubusercontent.com';

function repoPath() {
  if (!contentRepo.owner) {
    throw new Error(
      'CONTENT_REPO_OWNER is not set. Point it at the GitHub account that owns the content repo, or set CONTENT_DIR to read a local checkout.',
    );
  }

  return `${contentRepo.owner}/${contentRepo.repo}`;
}

function headers(accept = 'application/vnd.github+json') {
  const out: Record<string, string> = { accept };
  if (contentRepo.token) out.authorization = `Bearer ${contentRepo.token}`;
  return out;
}

/** how long the list of branches is reused before asking GitHub again */
const previewRevalidateSeconds = 30;

/** Head commit of the published branch, cached until the webhook expires `contentTag`. */
export async function getPublishedHead(): Promise<string> {
  const branch = contentRepo.branch;
  const res = await fetch(`${api}/repos/${repoPath()}/branches/${encodeURIComponent(branch)}`, {
    headers: headers(),
    cache: 'force-cache',
    next: { tags: [contentTag] },
  });
  if (!res.ok) throw new Error(`GitHub: failed to read branch "${branch}" (${res.status})`);

  const data = (await res.json()) as { commit: { sha: string } };
  return data.commit.sha;
}

/**
 * Head commit of any branch of the content repo, `null` if there is no such branch.
 *
 * Previews are public, so this must not spend one API request per visit: the list of branches is fetched once
 * and reused for a few seconds, and any number of made-up branch names is answered from it.
 * Only the first 100 branches are listed.
 */
export async function getBranchHead(branch: string): Promise<string | null> {
  const res = await fetch(`${api}/repos/${repoPath()}/branches?per_page=100`, {
    headers: headers(),
    next: { revalidate: previewRevalidateSeconds },
  });
  if (!res.ok) throw new Error(`GitHub: failed to list branches (${res.status})`);

  const branches = (await res.json()) as { name: string; commit: { sha: string } }[];
  return branches.find((item) => item.name === branch)?.commit.sha ?? null;
}

interface TreeEntry {
  path: string;
  type: 'blob' | 'tree' | 'commit';
  sha: string;
}

const snapshots = new Map<string, Promise<ContentSnapshot>>();

/**
 * Read every content file at a commit. Commits are immutable, so everything here is cached forever.
 *
 * The published commit is requested on every page view, so it is never the least recently used entry.
 */
export function getGithubSnapshot(commit: string): Promise<ContentSnapshot> {
  return remember(snapshots, commit, 8, () => {
    const snapshot = loadSnapshot(commit);
    // a failed download must not stay cached, the next request tries again
    snapshot.catch(() => snapshots.delete(commit));
    return snapshot;
  });
}

async function fetchText(url: string) {
  // raw.githubusercontent.com fails occasionally, one retry avoids losing the whole snapshot to a single hiccup
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url, { headers: headers('text/plain'), cache: 'force-cache' });
      if (res.ok) return await res.text();
      if (attempt === 2 || res.status < 500) throw new Error(`GitHub: failed to read ${url} (${res.status})`);
    } catch (error) {
      if (attempt === 2) throw error;
    }
  }
}

/** Like `Promise.all(items.map(fn))`, but with at most `limit` calls running at once. */
async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out = new Array<R>(items.length);
  let next = 0;

  async function worker() {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

async function loadSnapshot(commit: string): Promise<ContentSnapshot> {
  const repo = repoPath();
  const res = await fetch(`${api}/repos/${repo}/git/trees/${commit}?recursive=1`, {
    headers: headers(),
    cache: 'force-cache',
  });
  if (!res.ok) throw new Error(`GitHub: failed to read tree of ${commit} (${res.status})`);

  const { tree, truncated } = (await res.json()) as { tree: TreeEntry[]; truncated: boolean };
  // a truncated tree would silently publish the site with pages missing
  if (truncated) {
    throw new Error(`GitHub: the content repo has too many files to list in one request (commit ${commit})`);
  }

  const prefix = `${contentRoot}/`;
  const entries = tree.filter(
    (entry) => entry.type === 'blob' && entry.path.startsWith(prefix) && isContentFile(entry.path),
  );
  const base = `${raw}/${repo}/${commit}`;

  const files = await mapLimit(entries, 12, async (entry): Promise<ContentFile> => ({
    path: entry.path.slice(prefix.length),
    content: await fetchText(`${base}/${encodePath(entry.path)}`),
    version: entry.sha,
  }));

  return {
    id: commit,
    files,
    assetUrl: (path) => `${base}/${encodePath(`${prefix}${path}`)}`,
    imageOrigin: raw,
  };
}

function encodePath(path: string) {
  return path.split('/').map(encodeURIComponent).join('/');
}

/** Date of the last commit that touched a file, `null` when it cannot be determined. */
export async function getGithubLastEdit(
  branch: string,
  file: ContentFile,
): Promise<Date | null> {
  const params = new URLSearchParams({
    path: `${contentRoot}/${file.path}`,
    sha: branch,
    per_page: '1',
    // not read by GitHub: makes the cache entry change only when the file itself changes
    blob: file.version,
  });

  try {
    const res = await fetch(`${api}/repos/${repoPath()}/commits?${params}`, {
      headers: headers(),
      cache: 'force-cache',
    });
    if (!res.ok) return null;

    const commits = (await res.json()) as { commit: { committer: { date: string } } }[];
    return commits.length > 0 ? new Date(commits[0].commit.committer.date) : null;
  } catch {
    return null;
  }
}
