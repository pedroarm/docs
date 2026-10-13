import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
  EditOnGitHub,
} from 'fumadocs-ui/layouts/docs/page';
import { Callout } from 'fumadocs-ui/components/callout';
import { contentRoot, repoUrl } from '@/lib/config';
import { getLastEdit, type Docs, type DocsPage as Page } from '@/lib/source';
import { getMarkdownComponents } from './markdown';

// formatted on the server with a fixed time zone, so the output does not depend on where it runs
const dateFormat = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeZone: 'America/Sao_Paulo' });

export async function DocsPageView({ docs, page }: { docs: Docs; page: Page }) {
  const [compiled, lastEdit] = await Promise.all([
    page.data.load().catch((error: unknown) => (error instanceof Error ? error : new Error(String(error)))),
    getLastEdit(docs, page),
  ]);
  const failed = compiled instanceof Error;

  return (
    <DocsPage toc={failed ? [] : compiled.toc} full={page.data.full}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
        {failed ? (
          <>
            <Callout type="error" title="Esta página tem um erro de sintaxe">
              {compiled.message}
            </Callout>
            <pre className="whitespace-pre-wrap">{page.data.markdown}</pre>
          </>
        ) : (
          compiled.render(getMarkdownComponents(docs, page))
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
