import type { ReactNode } from 'react';
import type { Folder, Item, Node, Root } from 'fumadocs-core/page-tree';

export interface AreaLink {
  name: ReactNode;
  url: string;
}

export interface AreaGroup {
  /** undefined for pages that sit directly in the area */
  name?: ReactNode;
  links: AreaLink[];
}

export interface Area extends AreaLink {
  description?: ReactNode;
  icon?: ReactNode;
  groups: AreaGroup[];
}

function pages(nodes: Node[]): Item[] {
  return nodes.flatMap((node) => {
    if (node.type === 'page') return node.external ? [] : [node];
    if (node.type === 'folder') return [...(node.index ? [node.index] : []), ...pages(node.children)];
    return [];
  });
}

function toArea(folder: Folder): Area | undefined {
  const url = folder.index?.url ?? pages(folder.children)[0]?.url;
  if (!url) return undefined;

  const sections = folder.children.filter((node) => node.type === 'folder');
  // the area name already links to its index, repeating it only earns a row when the area has nothing but pages
  const direct = pages(folder.children.filter((node) => node.type === 'page')).filter(
    (page) => sections.length === 0 || page.url !== url,
  );
  const groups: AreaGroup[] = direct.length > 0 ? [{ links: direct }] : [];
  for (const node of folder.children) {
    if (node.type !== 'folder') continue;

    const links = pages([node]);
    if (links.length > 0) groups.push({ name: node.name, links });
  }

  return { name: folder.name, description: folder.description, icon: folder.icon, url, groups };
}

/** The top-level folders of the docs, each with its pages grouped by section. */
export function getAreas(tree: Root): Area[] {
  return tree.children.flatMap((node) => {
    const area = node.type === 'folder' ? toArea(node) : undefined;
    return area ? [area] : [];
  });
}
