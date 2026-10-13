import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { appName, repoUrl } from './config';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: { title: appName },
    githubUrl: repoUrl,
  };
}
