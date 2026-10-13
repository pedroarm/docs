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
  /**
   * Images under this origin go through the Next image optimizer, the host must be allowed in `next.config.mjs`.
   * Anything else (other sites, local files) is loaded as-is.
   */
  imageOrigin?: string;
}

export function isContentFile(path: string) {
  return /\.(md|mdx)$/.test(path) || path.endsWith('meta.json');
}
