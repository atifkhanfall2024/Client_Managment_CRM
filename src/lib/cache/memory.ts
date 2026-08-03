type Entry<T> = {
  value: T;
  expiresAt: number;
};

const store = new Map<string, Entry<unknown>>();
const tagIndex = new Map<string, Set<string>>();

/** Process-local TTL cache — zero network on hot navigations. */
export function memoryGet<T>(key: string): T | undefined {
  const hit = store.get(key);
  if (!hit) return undefined;
  if (Date.now() > hit.expiresAt) {
    store.delete(key);
    return undefined;
  }
  return hit.value as T;
}

export function memorySet<T>(
  key: string,
  value: T,
  ttlMs: number,
  tags: string[] = []
) {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
  for (const tag of tags) {
    let keys = tagIndex.get(tag);
    if (!keys) {
      keys = new Set();
      tagIndex.set(tag, keys);
    }
    keys.add(key);
  }
}

export function memoryInvalidateByTags(tags: string[]) {
  for (const tag of tags) {
    const keys = tagIndex.get(tag);
    if (!keys) continue;
    for (const key of keys) store.delete(key);
    tagIndex.delete(tag);
  }
}

export function memoryClear() {
  store.clear();
  tagIndex.clear();
}
