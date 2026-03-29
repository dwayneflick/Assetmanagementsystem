// KV Store helper — wraps the kv_store_5921d82e Supabase table
import { createClient } from "npm:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const TABLE = "kv_store_5921d82e";

/** Get a single value by key. Returns null if not found. */
export async function get(key: string): Promise<any> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("value")
    .eq("key", key)
    .maybeSingle();
  if (error) {
    console.error(`kv.get("${key}") error:`, error.message);
    return null;
  }
  return data?.value ?? null;
}

/** Set (upsert) a value by key. */
export async function set(key: string, value: any): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .upsert({ key, value }, { onConflict: "key" });
  if (error) {
    console.error(`kv.set("${key}") error:`, error.message);
    throw new Error(error.message);
  }
}

/** Delete a key. */
export async function del(key: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq("key", key);
  if (error) {
    console.error(`kv.del("${key}") error:`, error.message);
    throw new Error(error.message);
  }
}

/** Get multiple values by keys. Returns array of values (nulls omitted). */
export async function mget(keys: string[]): Promise<any[]> {
  if (keys.length === 0) return [];
  const { data, error } = await supabase
    .from(TABLE)
    .select("value")
    .in("key", keys);
  if (error) {
    console.error("kv.mget error:", error.message);
    return [];
  }
  return (data ?? []).map((row) => row.value);
}

/** Set multiple key-value pairs. */
export async function mset(pairs: { key: string; value: any }[]): Promise<void> {
  if (pairs.length === 0) return;
  const { error } = await supabase
    .from(TABLE)
    .upsert(pairs, { onConflict: "key" });
  if (error) {
    console.error("kv.mset error:", error.message);
    throw new Error(error.message);
  }
}

/** Delete multiple keys. */
export async function mdel(keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  const { error } = await supabase.from(TABLE).delete().in("key", keys);
  if (error) {
    console.error("kv.mdel error:", error.message);
    throw new Error(error.message);
  }
}

/** Get all values whose key starts with the given prefix. */
export async function getByPrefix(prefix: string): Promise<any[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("value")
    .like("key", `${prefix}%`);
  if (error) {
    console.error(`kv.getByPrefix("${prefix}") error:`, error.message);
    return [];
  }
  return (data ?? []).map((row) => row.value);
}
