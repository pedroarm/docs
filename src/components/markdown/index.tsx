import {
  Children,
  isValidElement,
  type ComponentProps,
  type ElementType,
  type ReactElement,
  type ReactNode,
} from 'react';
import Image from 'next/image';
import defaultMdxComponents, { createRelativeLink } from 'fumadocs-ui/mdx';
import { Callout } from 'fumadocs-ui/components/callout';
import { Step, Steps } from 'fumadocs-ui/components/steps';
import { Tab, Tabs } from 'fumadocs-ui/components/tabs';
import type { Components } from 'hast-util-to-jsx-runtime';
import type { AuthorComponent } from '@/lib/content/components';
import type { Docs, DocsPage } from '@/lib/source';
import { Checklist, TaskInput } from './checklist';
import { YouTube } from './youtube';

interface TabProps {
  title?: string;
  children?: ReactNode;
}

/** only rendered when a `<Tab>` is written outside of `<Tabs>` */
function LooseTab({ children }: TabProps) {
  return children;
}

/** `<Tabs>` with `<Tab title="...">` children, so authors never need a JS expression to list the tabs */
function ContentTabs({ children }: { children?: ReactNode }) {
  const tabs = Children.toArray(children).filter((child): child is ReactElement<TabProps> =>
    isValidElement(child),
  );
  const items = tabs.map((tab, i) => tab.props.title ?? `Opção ${i + 1}`);

  return (
    <Tabs items={items}>
      {tabs.map((tab, i) => (
        <Tab key={items[i]} value={items[i]}>
          {tab.props.children}
        </Tab>
      ))}
    </Tabs>
  );
}

function ContentImage({
  src,
  alt = '',
  imageOrigin,
}: ComponentProps<'img'> & { imageOrigin?: string }) {
  if (typeof src !== 'string') return null;

  // only images of the content repo can be optimized, any other host would be rejected by the optimizer
  const optimize = imageOrigin !== undefined && src.startsWith(`${imageOrigin}/`) && !/\.(svg|gif)$/i.test(src);

  return (
    <Image
      src={src}
      alt={alt}
      width={1600}
      height={900}
      sizes="(min-width: 1024px) 800px, 100vw"
      unoptimized={!optimize}
      className="rounded-lg border"
      style={{ width: '100%', height: 'auto' }}
    />
  );
}

export function getMarkdownComponents(docs: Docs, page: DocsPage): Components {
  // typed against the registry: listing a component there without implementing it here is a type error
  const authorComponents: Record<AuthorComponent, ElementType> = {
    Callout,
    Steps,
    Step,
    Tabs: ContentTabs,
    Tab: LooseTab,
    YouTube,
    Checklist,
  };

  return {
    ...defaultMdxComponents,
    // lets authors link to other pages with relative file paths
    a: createRelativeLink(docs.source, page),
    img: (props: ComponentProps<'img'>) => (
      <ContentImage {...props} imageOrigin={docs.snapshot.imageOrigin} />
    ),
    input: TaskInput,
    ...authorComponents,
  } as Components;
}
