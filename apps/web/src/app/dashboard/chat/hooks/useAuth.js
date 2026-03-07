import { useEffect, useState } from "react";
import { createSupabaseBrowser } from "../../../../lib/supabase/client";

export default function useAuth() {
  const [accessToken, setAccessToken] = useState(null);

  useEffect(() => {
    const supabase = createSupabaseBrowser();

    async function loadSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        setAccessToken(session.access_token);
      }
    }

    loadSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setAccessToken(session?.access_token ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return accessToken;
}
