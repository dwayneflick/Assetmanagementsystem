const kv = (globalThis as any).Deno
  ? (await import("https://deno.land/x/deno_kv@0.0.1/mod.ts")).default
  : null;

const store = new Map<string, any>();

export async function get(key: string): Promise<any> {
  try {
    if (kv) {
      const result = await kv.get([key]);
      return result?.value ?? null;
    }
    return store.get(key) ?? null;
  } catch {
    return store.get(key) ?? null;
  }
}

export async function set(key: string, value: any): Promise<void> {
  try {
    if (kv) {
      await kv.set([key], value);
      return;
    }
    store.set(key, value);
  } catch {
    store.set(key, value);
  }
}

export async function del(key: string): Promise<void> {
  try {
    if (kv) {
      await kv.delete([key]);
      return;
    }
    store.delete(key);
  } catch {
    store.delete(key);
  }
}

export async function mdel(keys: string[]): Promise<void> {
  for (const key of keys) {
    await del(key);
  }
}

export async function getByPrefix(prefix: string): Promise<any[]> {
  try {
    if (kv) {
      const entries = kv.list({ prefix: [prefix] });
      const results: any[] = [];
      for await (const entry of entries) {
        results.push(entry.value);
      }
      return results;
    }
    const results: any[] = [];
    for (const [key, value] of store.entries()) {
      if (key.startsWith(prefix)) {
        results.push(value);
      }
    }
    return results;
  } catch {
    const results: any[] = [];
    for (const [key, value] of store.entries()) {
      if (key.startsWith(prefix)) {
        results.push(value);
      }
    }
    return results;
  }
}