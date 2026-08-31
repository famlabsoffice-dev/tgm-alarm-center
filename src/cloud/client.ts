import { createClient, SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

export function cloudClient(): SupabaseClient {
  if (client) return client;
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Cloud-Sync ist nicht konfiguriert');
  client = createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } });
  return client;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await cloudClient().auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw error;
  return data.session;
}

export async function signOut() { const { error } = await cloudClient().auth.signOut(); if (error) throw error; }

export async function deleteCloudAccount() {
  const { data } = await cloudClient().auth.getUser();
  if (!data.user) throw new Error('Keine aktive Sitzung');
  const { error } = await cloudClient().rpc('delete_my_account');
  if (error) throw error;
  await signOut();
}
