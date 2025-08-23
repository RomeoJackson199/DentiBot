import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Processes Supabase auth callback parameters then cleans the URL.
 * - Handles PKCE code exchange (?code=...)
 * - Handles implicit hash fragments (#access_token=...)
 * - Removes query/hash from the URL after processing
 */
export const AuthCallbackHandler = () => {
  useEffect(() => {
    const processAuthCallback = async () => {
      const currentUrl = new URL(window.location.href);
      const { search, hash } = currentUrl;

      const hasPkceCode = currentUrl.searchParams.has("code");
      const hasImplicitHash =
        hash.includes("access_token") ||
        hash.includes("refresh_token") ||
        hash.includes("provider_token") ||
        hash.includes("error");

      const cleanupUrl = (removeAllParams: boolean) => {
        const cleaned = removeAllParams
          ? `${currentUrl.origin}${currentUrl.pathname}`
          : `${currentUrl.origin}${currentUrl.pathname}${currentUrl.search}`;
        window.history.replaceState({}, document.title, cleaned);
      };

      try {
        if (hasPkceCode) {
          // PKCE callback: exchange code for a session
          await supabase.auth.exchangeCodeForSession(window.location.href);
          // Remove the code and other params from the URL entirely
          cleanupUrl(true);
          return;
        }

        if (hasImplicitHash) {
          // Parse tokens from the hash and set the session explicitly (robust across environments)
          const params = new URLSearchParams(hash.replace(/^#/, ""));
          const access_token = params.get("access_token") || undefined;
          const refresh_token = params.get("refresh_token") || undefined;

          if (access_token && refresh_token) {
            await supabase.auth.setSession({ access_token, refresh_token });
          } else {
            // Fallback: trigger internal detection if available
            await supabase.auth.getSession();
          }

          // Remove the hash portion from the URL (keep any non-auth search params)
          cleanupUrl(false);
        }
      } catch (error) {
        console.error("Auth callback processing failed:", error);
        // Attempt to clean up even on failure to avoid exposing tokens in the URL
        if (hasImplicitHash || hasPkceCode) {
          cleanupUrl(hasPkceCode);
        }
      }
    };

    processAuthCallback();
  }, []);

  return null;
};

export default AuthCallbackHandler;
