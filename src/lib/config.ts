export const appName = 'Equipe Técnica';
export const appDescription =
  'Documentação da equipe técnica: onboarding, procedimentos, solução de problemas e manuais de equipamento.';

export const docsRoute = '/docs';
export const previewRoute = '/preview';

/** cache tag shared by every request that reads the published content */
export const contentTag = 'content';

/** folder inside the content repo that holds the documentation */
export const contentRoot = 'docs';

export const contentRepo = {
  owner: process.env.CONTENT_REPO_OWNER,
  repo: process.env.CONTENT_REPO_NAME ?? 'docs-content',
  branch: process.env.CONTENT_REPO_BRANCH ?? 'main',
  token: process.env.GITHUB_TOKEN,
};

/**
 * When set, content is read from this local folder (a checkout of the content repo)
 * instead of GitHub. Meant for local development.
 */
export const localContentDir = process.env.CONTENT_DIR;

export const repoUrl = contentRepo.owner
  ? `https://github.com/${contentRepo.owner}/${contentRepo.repo}`
  : undefined;
