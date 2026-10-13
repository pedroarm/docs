import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { contentRoot } from '@/lib/config';
import { isContentFile, type ContentFile, type ContentSnapshot } from './types';

export const localAssetRoute = '/local-content';

export function localContentRoot(dir: string) {
  return path.resolve(/* turbopackIgnore: true */ dir, contentRoot);
}

let previous: ContentSnapshot | undefined;

/** Read every content file from a local checkout of the content repo. */
export async function getLocalSnapshot(dir: string): Promise<ContentSnapshot> {
  const root = localContentRoot(dir);
  const names = await readdir(root, { recursive: true });

  const files = await Promise.all(
    names
      .map((name) => name.split(path.sep).join('/'))
      .filter(isContentFile)
      .sort()
      .map(async (name): Promise<ContentFile> => {
        const file = path.join(root, name);
        const info = await stat(file);

        return {
          path: name,
          content: await readFile(file, 'utf8'),
          version: String(info.mtimeMs),
        };
      }),
  );

  const id = files.map((file) => `${file.path}:${file.version}`).join('|');
  // reuse the snapshot while nothing changed, so compiled pages stay cached between requests
  if (previous?.id === id) return previous;

  previous = {
    id,
    files,
    assetUrl: (asset) => `${localAssetRoute}/${asset.split('/').map(encodeURIComponent).join('/')}`,
    optimizeImages: false,
  };
  return previous;
}

export async function getLocalLastEdit(dir: string, file: ContentFile): Promise<Date | null> {
  try {
    return (await stat(path.join(localContentRoot(dir), file.path))).mtime;
  } catch {
    return null;
  }
}
