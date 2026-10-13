/**
 * Everything authors may write in Markdown besides plain Markdown, and the attributes each one accepts.
 *
 * This is the single registry: the compiler drops any tag or attribute that is not listed here,
 * and `src/components/markdown` must provide an implementation for every component listed here.
 *
 * An attribute is either free text (`true`) or limited to a list of values.
 */
export const authorComponents = {
  Callout: { type: ['info', 'warn', 'warning', 'error', 'success', 'idea'], title: true },
  Steps: {},
  Step: {},
  Tabs: {},
  Tab: { title: true },
  YouTube: { id: true, title: true },
  Checklist: { id: true },
} as const satisfies Registry;

/** plain HTML elements that are useful in prose and safe to pass through */
export const authorElements = {
  br: {},
  kbd: {},
  details: { open: true },
  summary: {},
  sub: {},
  sup: {},
  mark: {},
} as const satisfies Registry;

type Registry = Record<string, Record<string, true | readonly string[]>>;

export type AuthorComponent = keyof typeof authorComponents;

const registry: Registry = { ...authorComponents, ...authorElements };

/** attributes accepted by a tag, `undefined` when authors may not use the tag at all */
export function allowedAttributes(tag: string) {
  return Object.hasOwn(registry, tag) ? registry[tag] : undefined;
}
