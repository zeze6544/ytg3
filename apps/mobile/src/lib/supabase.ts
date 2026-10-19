import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import Constants from "expo-constants";

const extra = (Constants.expoConfig?.extra ?? {}) as {
  supabaseUrl?: string;
  supabaseKey?: string;
};

export const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL || extra.supabaseUrl || "https://kmqfeknqejdiszirfrkj.supabase.co";

export const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY || extra.supabaseKey || "";

export const archiveConfigured = Boolean(supabaseUrl && supabaseKey);

export class ArchiveConfigError extends Error {
  constructor() {
    super("The archive link is not configured on this build.");
    this.name = "ArchiveConfigError";
  }
}

export const supabase: SupabaseClient | null = archiveConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;

export function requireClient(): SupabaseClient {
  if (!supabase) throw new ArchiveConfigError();
  return supabase;
}
