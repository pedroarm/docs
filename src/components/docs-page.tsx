import type { ReactNode } from 'react';
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
  EditOnGitHub,
} from 'fumadocs-ui/layouts/notebook/page';
import { Callout } from 'fumadocs-ui/components/callout';
import { contentRoot, repoUrl } from '@/lib/config';
import { getLastEdit, type Docs, type DocsPage as Page } from '@/lib/source';
import { getMarkdownComponents } from './markdown';

// formatted on the server with a fixed time zone, so the output does not depend on where it runs
const dateFormat = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeZone: 'America/Sao_Paulo' });

function toError(error: unknown) {
  return error instanceof Error ? error : new Error(String(error));
}

export async function DocsPageView({ docs, page }: { docs: Docs; page: Page }) {
  const [compiled, lastEdit] = await Promise.all([
    page.data.load().catch(toError),
    getLastEdit(docs, page),
  ]);

  // content is written outside of code review: a page that cannot be compiled or rendered shows the error
  // to its author instead of taking the route (or the build) down
  let body: ReactNode;
  let failure = compiled instanceof Error ? compiled : undefined;
  if (!(compiled instanceof Error)) {
    try {
      body = compiled.render(getMarkdownComponents(docs, page));
    } catch (error) {
      failure = toError(error);
    }
  }

  return (
    <DocsPage
      toc={compiled instanceof Error ? [] : compiled.toc}
      full={page.data.full}
      // the area tabs are hidden on small screens, the breadcrumb keeps saying which area this is
      breadcrumb={{ includeRoot: true }}
    >
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
        {failure ? (
          <>
            <Callout type="error" title="Esta página tem um erro de sintaxe">
              {failure.message}
            </Callout>
            <pre className="whitespace-pre-wrap">{page.data.markdown}</pre>
          </>
        ) : (
          body
        )}
      </DocsBody>
      <div className="flex flex-wrap items-center justify-between gap-4 border-t pt-6">
        {repoUrl && docs.branch ? (
          <EditOnGitHub href={`${repoUrl}/edit/${docs.branch}/${contentRoot}/${page.path}`} />
        ) : null}
        {lastEdit ? (
          <p className="text-sm text-fd-muted-foreground">
            Última atualização em {dateFormat.format(lastEdit)}
          </p>
        ) : null}
      </div>
    </DocsPage>
  );
}
