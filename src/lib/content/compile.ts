import type { ReactNode } from 'react';
import { Fragment, jsx, jsxs } from 'react/jsx-runtime';
import { unified, type Plugin } from 'unified';
import remarkParse from 'remark-parse';
import remarkMdx from 'remark-mdx';
import remarkRehype from 'remark-rehype';
import { visit, SKIP } from 'unist-util-visit';
import { VFile } from 'vfile';
import { toJsxRuntime, type Components } from 'hast-util-to-jsx-runtime';
import type { Root as HastRoot } from 'hast';
import type { Root } from 'mdast';
import {
  rehypeCode,
  remarkGfm,
  remarkHeading,
  remarkStructure,
  type StructuredData,
} from 'fumadocs-core/mdx-plugins';
import type { TOCItemType } from 'fumadocs-core/toc';

/** components authors may use, anything else is unwrapped into its content */
const allowedComponents = new Set(['Callout', 'Steps', 'Step', 'Tabs', 'Tab', 'YouTube', 'Checklist']);
const allowedElements = new Set(['br', 'kbd', 'details', 'summary', 'sub', 'sup', 'mark']);

export interface CompiledPage {
  toc: TOCItemType[];
  structuredData: StructuredData;
  render: (components: Components) => ReactNode;
}

declare module 'vfile' {
  interface DataMap {
    resolveAsset: (path: string) => string;
  }
}

/**
 * Content comes from a repo that is edited outside of code review, so it must never execute code:
 * imports/exports and `{expressions}` are dropped, and JSX is limited to an allow list with literal attributes.
 */
const remarkSafeJsx: Plugin<[], Root> = () => (tree) => {
  visit(tree, (node, index, parent) => {
    if (!parent || index === undefined) return;

    if (
      node.type === 'mdxjsEsm' ||
      node.type === 'mdxFlowExpression' ||
      node.type === 'mdxTextExpression'
    ) {
      parent.children.splice(index, 1);
      return [SKIP, index];
    }

    if (node.type !== 'mdxJsxFlowElement' && node.type !== 'mdxJsxTextElement') return;

    if (!node.name || !(allowedComponents.has(node.name) || allowedElements.has(node.name))) {
      parent.children.splice(index, 1, ...(node.children as never[]));
      return [SKIP, index];
    }

    const properties: Record<string, string | boolean> = {};
    for (const attribute of node.attributes) {
      if (attribute.type !== 'mdxJsxAttribute') continue;
      if (attribute.value == null) properties[attribute.name] = true;
      else if (typeof attribute.value === 'string') properties[attribute.name] = attribute.value;
    }

    node.data = { ...node.data, hName: node.name, hProperties: properties };
  });
};

function isRelative(url: string) {
  return !/^([a-z][a-z\d+.-]*:|\/|#)/i.test(url);
}

/** point relative image paths at the content repo */
const remarkAssets: Plugin<[], Root> = () => (tree, file) => {
  const resolveAsset = file.data.resolveAsset;
  if (!resolveAsset) return;

  visit(tree, 'image', (node) => {
    if (!isRelative(node.url)) return;

    const resolved = new URL(node.url, `file:///${file.dirname ?? ''}/`).pathname.slice(1);
    node.url = resolveAsset(decodeURIComponent(resolved));
  });
};

const processor = unified()
  .use(remarkParse)
  .use(remarkMdx)
  .use(remarkGfm)
  .use(remarkHeading)
  .use(remarkStructure, { exportAs: false })
  .use(remarkSafeJsx)
  .use(remarkAssets)
  .use(remarkRehype)
  .use(rehypeCode);

export async function compile(input: {
  path: string;
  content: string;
  resolveAsset: (path: string) => string;
}): Promise<CompiledPage> {
  const file = new VFile({ path: input.path, value: input.content });
  file.data.resolveAsset = input.resolveAsset;

  const tree = (await processor.run(processor.parse(file), file)) as HastRoot;

  return {
    toc: (file.data.toc as TOCItemType[] | undefined) ?? [],
    structuredData: file.data.structuredData ?? { headings: [], contents: [] },
    render: (components) => toJsxRuntime(tree, { Fragment, jsx, jsxs, components }),
  };
}
