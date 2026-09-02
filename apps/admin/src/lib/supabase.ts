import { useMemo } from "react";
import { useAuth } from "@clerk/expo";
import { createClerkSupabaseClient } from "@astrokraft/db";

export function useSupabase() {
  const { getToken } = useAuth();

  return useMemo(
    () =>
      createClerkSupabaseClient(
        { getToken: () => getToken() },
        process.env.EXPO_PUBLIC_SUPABASE_URL,
        process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
      ),
    [getToken]
  );
}
