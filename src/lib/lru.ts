/**
 * Get a value from a small in-memory cache, creating it when missing.
 *
 * Reading an entry marks it as recently used, so once the cache is over `max`
 * the entry dropped is the one nobody asked for the longest.
 */
export function remember<K, V>(cache: Map<K, V>, key: K, max: number, create: () => V): V {
  let value: V;
  if (cache.has(key)) {
    value = cache.get(key)!;
    cache.delete(key);
  } else {
    value = create();
  }

  // a Map iterates in insertion order: re-inserting moves the entry to the end
  cache.set(key, value);
  if (cache.size > max) cache.delete(cache.keys().next().value!);
  return value;
}
