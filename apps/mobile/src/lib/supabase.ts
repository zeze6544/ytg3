import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import Constants from "expo-constants";
import { ARCHIVE_ORIGIN, LOCAL_DRUG_COUNT } from "@/lib/localArchive";

const extra = (Constants.expoConfig?.extra ?? {}) as {
  supabaseUrl?: string;
  supabaseKey?: string;
};

export const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL || extra.supabaseUrl || "https://kmqfeknqejdiszirfrkj.supabase.co";

export const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY || extra.supabaseKey || "";

const remoteArchive = Boolean(supabaseUrl && supabaseKey);
/** Accounts exist only when this build has a working remote client. The public archive does not. */
export const accountsEnabled = remoteArchive;
export const archiveConfigured = remoteArchive || LOCAL_DRUG_COUNT > 0 || ARCHIVE_ORIGIN.startsWith("https://");

export class ArchiveConfigError extends Error {
  constructor() {
    super("The archive link is not configured on this build.");
    this.name = "ArchiveConfigError";
  }
}

export const supabase: SupabaseClient | null = remoteArchive
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
