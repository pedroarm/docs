import type { DocsLayoutProps } from 'fumadocs-ui/layouts/notebook';
import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { appName, repoUrl } from './config';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: { title: appName },
    githubUrl: repoUrl,
  };
}

/** areas are tabs in the header, the sidebar only lists the current area with every section open */
export function docsOptions(): Omit<DocsLayoutProps, 'tree'> {
  const base = baseOptions();

  return {
    ...base,
    nav: { ...base.nav, mode: 'top' },
    tabMode: 'navbar',
    sidebar: { defaultOpenLevel: 1, collapsible: false },
  };
}
