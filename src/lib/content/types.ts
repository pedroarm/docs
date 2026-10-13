export interface ContentFile {
  /** path relative to the content root, e.g. `som/procedimentos/ligar.md` */
  path: string;
  content: string;
  /** changes whenever the file content changes (git blob sha, or mtime locally) */
  version: string;
}

export interface ContentSnapshot {
  /** identifies this exact state of the content (commit sha, or a local fingerprint) */
  id: string;
  files: ContentFile[];
  /** resolve a path relative to the content root into a URL an `<img>` can load */
  assetUrl: (path: string) => string;
  /** assets served by the image optimizer need an allowed remote host */
  optimizeImages: boolean;
}

export function isContentFile(path: string) {
  return /\.(md|mdx)$/.test(path) || path.endsWith('meta.json');
}
