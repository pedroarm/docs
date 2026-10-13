import { Children, isValidElement, type ComponentProps, type ReactElement, type ReactNode } from 'react';
import Image from 'next/image';
import defaultMdxComponents, { createRelativeLink } from 'fumadocs-ui/mdx';
import { Callout } from 'fumadocs-ui/components/callout';
import { Step, Steps } from 'fumadocs-ui/components/steps';
import { Tab, Tabs } from 'fumadocs-ui/components/tabs';
import type { Components } from 'hast-util-to-jsx-runtime';
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
  optimize,
}: ComponentProps<'img'> & { optimize: boolean }) {
  if (typeof src !== 'string') return null;

  return (
    <Image
      src={src}
      alt={alt}
      width={1600}
      height={900}
      sizes="(min-width: 1024px) 800px, 100vw"
      unoptimized={!optimize || /\.(svg|gif)$/i.test(src)}
      className="rounded-lg border"
      style={{ width: '100%', height: 'auto' }}
    />
  );
}

export function getMarkdownComponents(docs: Docs, page: DocsPage): Components {
  return {
    ...defaultMdxComponents,
    // lets authors link to other pages with relative file paths
    a: createRelativeLink(docs.source, page),
    img: (props: ComponentProps<'img'>) => (
      <ContentImage {...props} optimize={docs.snapshot.optimizeImages} />
    ),
    input: TaskInput,
    Callout,
    Steps,
    Step,
    Tabs: ContentTabs,
    Tab: LooseTab,
    YouTube,
    Checklist,
  } as Components;
}
