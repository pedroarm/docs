import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { localContentDir } from '@/lib/config';
import { localContentRoot } from '@/lib/content/local';

const types: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
};

/** Serves images of a local checkout of the content repo, only used with `CONTENT_DIR`. */
export async function GET(_: Request, ctx: RouteContext<'/local-content/[...path]'>) {
  if (!localContentDir) return new Response(null, { status: 404 });

  const root = localContentRoot(localContentDir);
  const file = path.resolve(root, ...(await ctx.params).path);
  const type = types[path.extname(file).toLowerCase()];
  if (!type || !file.startsWith(root + path.sep)) return new Response(null, { status: 404 });

  try {
    return new Response(new Uint8Array(await readFile(file)), { headers: { 'content-type': type } });
  } catch {
    return new Response(null, { status: 404 });
  }
}
