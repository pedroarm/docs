'use client';

import {
  createContext,
  use,
  useCallback,
  useEffect,
  useRef,
  useSyncExternalStore,
  type ComponentProps,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';
import { RotateCcw } from 'lucide-react';

const ChecklistContext = createContext(false);

// progress lives in localStorage, mirrored in memory so it still works when storage is unavailable (private mode)
const memory = new Map<string, string>();
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener('storage', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
}

function read(key: string): string {
  const cached = memory.get(key);
  if (cached !== undefined) return cached;

  try {
    return localStorage.getItem(key) ?? '[]';
  } catch {
    return '[]';
  }
}

function write(key: string, value: boolean[]) {
  const json = JSON.stringify(value);
  memory.set(key, json);
  try {
    if (value.some(Boolean)) localStorage.setItem(key, json);
    else localStorage.removeItem(key);
  } catch {
    // kept in memory for this visit
  }
  for (const listener of listeners) listener();
}

function parse(json: string): boolean[] {
  try {
    const saved: unknown = JSON.parse(json);
    return Array.isArray(saved) ? saved.map((item) => item === true) : [];
  } catch {
    return [];
  }
}

/**
 * Makes the task list inside it checkable, progress is kept on this device.
 *
 * `id` separates multiple checklists on the same page.
 */
export function Checklist({ id = 'default', children }: { id?: string; children: ReactNode }) {
  const pathname = usePathname();
  const key = `checklist:${pathname}:${id}`;
  const ref = useRef<HTMLDivElement>(null);
  const counter = useRef<HTMLSpanElement>(null);
  const resetButton = useRef<HTMLButtonElement>(null);
  const saved = useSyncExternalStore(
    subscribe,
    () => read(key),
    () => '[]',
  );

  const boxes = useCallback(
    () => Array.from(ref.current?.querySelectorAll<HTMLInputElement>('input[type="checkbox"]') ?? []),
    [],
  );

  // the checkboxes are rendered from Markdown, so the saved progress is applied to the DOM directly
  useEffect(() => {
    const state = parse(saved);
    const all = boxes();
    all.forEach((box, i) => {
      box.checked = state[i] === true;
    });

    const done = all.filter((box) => box.checked).length;
    if (counter.current) counter.current.textContent = `${done} de ${all.length} concluídos`;
    if (resetButton.current) resetButton.current.disabled = done === 0;
  }, [boxes, saved]);

  const save = () => write(key, boxes().map((box) => box.checked));

  // the whole row toggles the item, checkboxes alone are too small to hit on a phone
  function onClick(event: MouseEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    if (target.closest('input, a, button')) return;

    const box = target.closest('li')?.querySelector<HTMLInputElement>(':scope > input, :scope > p > input');
    if (!box) return;

    box.checked = !box.checked;
    save();
  }

  return (
    <ChecklistContext value={true}>
      <div
        ref={ref}
        onClick={onClick}
        onChange={save}
        className="checklist my-6 rounded-xl border bg-fd-card p-4"
      >
        <div className="not-prose mb-2 flex items-center justify-between gap-2 text-sm text-fd-muted-foreground">
          <span ref={counter} aria-live="polite" />
          <button
            ref={resetButton}
            type="button"
            onClick={() => write(key, [])}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-medium pointer-coarse:min-h-11 pointer-coarse:px-3 transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground disabled:pointer-events-none disabled:opacity-50"
          >
            <RotateCcw className="size-3.5" />
            Limpar
          </button>
        </div>
        {children}
      </div>
    </ChecklistContext>
  );
}

/** Task list checkbox: read-only as written in Markdown, interactive inside a `<Checklist>`. */
export function TaskInput({ checked, disabled, ...props }: ComponentProps<'input'>) {
  const interactive = use(ChecklistContext);
  if (props.type !== 'checkbox') return <input checked={checked} disabled={disabled} {...props} />;

  if (interactive) return <input {...props} defaultChecked={Boolean(checked)} />;
  return <input {...props} checked={Boolean(checked)} disabled readOnly />;
}
