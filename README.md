# docs

Site da documentação da equipe técnica. O conteúdo não fica aqui: as páginas são arquivos Markdown no repositório `docs-content`, lidos pela API do GitHub em tempo de execução.

## Como funciona

- **Conteúdo publicado**: a branch `main` do `docs-content`. O resultado fica em cache até o webhook do GitHub chamar `POST /api/revalidate`, que expira a tag `content`.
- **Pré-visualização**: `/preview/<branch>` renderiza qualquer branch do `docs-content` sem cache e fora dos buscadores.
- **Markdown seguro**: o conteúdo é interpretado como MDX, mas `import`, `export` e expressões `{}` são descartados e só os componentes e atributos registrados em `src/lib/content/components.ts` são aceitos. Nada do repositório de conteúdo é executado.
- **Busca**: índice Orama gerado no servidor a partir do conteúdo publicado (`/api/search`).

## Adicionar um componente ao Markdown

1. Registre o nome e os atributos aceitos em `src/lib/content/components.ts`.
2. Implemente o componente e inclua-o em `getMarkdownComponents`, em `src/components/markdown/index.tsx`. Enquanto isso não for feito, a checagem de tipos falha.
3. Documente a sintaxe para os autores em `docs/onboarding/como-contribuir.md`, no repositório `docs-content`.

## Desenvolvimento

Clone o `docs-content` ao lado deste repositório e aponte `CONTENT_DIR` para ele:

```bash
cp .env.example .env.local
pnpm install
pnpm dev
```

Com `CONTENT_DIR` definido, o site lê os arquivos locais e não acessa o GitHub.

## Produção

Variáveis de ambiente (veja `.env.example`):

| Variável | Uso |
| --- | --- |
| `CONTENT_REPO_OWNER` | Conta do GitHub dona do `docs-content` |
| `GITHUB_TOKEN` | Token com leitura de conteúdo do `docs-content`, para o limite de requisições da API |
| `GITHUB_WEBHOOK_SECRET` | Segredo do webhook do `docs-content` |

Webhook no `docs-content`: evento `push`, tipo `application/json`, URL `https://<site>/api/revalidate`.
