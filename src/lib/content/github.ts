import { contentRepo, contentRoot, contentTag } from '@/lib/config';
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

/**
 * Resolve a branch of the content repo to its head commit, returns `null` if the branch does not exist.
 *
 * The published branch is cached until the webhook expires `contentTag`, any other branch is always fresh.
 */
export async function getBranchHead(branch: string): Promise<string | null> {
  const published = branch === contentRepo.branch;
  const res = await fetch(`${api}/repos/${repoPath()}/branches/${encodeURIComponent(branch)}`, {
    headers: headers(),
    ...(published
      ? { cache: 'force-cache', next: { tags: [contentTag] } }
      : { cache: 'no-store' }),
  });

  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub: failed to read branch "${branch}" (${res.status})`);

  const data = (await res.json()) as { commit: { sha: string } };
  return data.commit.sha;
}

interface TreeEntry {
  path: string;
  type: 'blob' | 'tree' | 'commit';
  sha: string;
}

const snapshots = new Map<string, Promise<ContentSnapshot>>();

/** Read every content file at a commit. Commits are immutable, so everything here is cached forever. */
export function getGithubSnapshot(commit: string): Promise<ContentSnapshot> {
  let snapshot = snapshots.get(commit);
  if (!snapshot) {
    snapshot = loadSnapshot(commit);
    snapshot.catch(() => snapshots.delete(commit));
    snapshots.set(commit, snapshot);
    // keep the published commit and a few previews, old commits are never requested again
    if (snapshots.size > 8) snapshots.delete(snapshots.keys().next().value!);
  }

  return snapshot;
}

async function loadSnapshot(commit: string): Promise<ContentSnapshot> {
  const repo = repoPath();
  const res = await fetch(`${api}/repos/${repo}/git/trees/${commit}?recursive=1`, {
    headers: headers(),
    cache: 'force-cache',
  });
  if (!res.ok) throw new Error(`GitHub: failed to read tree of ${commit} (${res.status})`);

  const { tree } = (await res.json()) as { tree: TreeEntry[] };
  const prefix = `${contentRoot}/`;
  const entries = tree.filter(
    (entry) => entry.type === 'blob' && entry.path.startsWith(prefix) && isContentFile(entry.path),
  );

  const files = await Promise.all(
    entries.map(async (entry): Promise<ContentFile> => {
      const file = await fetch(`${raw}/${repo}/${commit}/${encodePath(entry.path)}`, {
        headers: headers('text/plain'),
        cache: 'force-cache',
      });
      if (!file.ok) throw new Error(`GitHub: failed to read ${entry.path} (${file.status})`);

      return {
        path: entry.path.slice(prefix.length),
        content: await file.text(),
        version: entry.sha,
      };
    }),
  );

  return {
    id: commit,
    files,
    assetUrl: (path) => `${raw}/${repo}/${commit}/${encodePath(`${prefix}${path}`)}`,
    optimizeImages: true,
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
