 "use client";
 import { useEffect, useState } from "react";
import { getSupabase } from "../../../lib/supabase";
import { useLanguage } from "@/contexts/LanguageContext";

export const dynamic = "force-dynamic";

export default function Confirm() {
  const [status, setStatus] = useState<"pending" | "ok" | "error">("pending");
  const { t } = useLanguage();
  const [message, setMessage] = useState<string>(t('confirming_email'));

  useEffect(() => {
    let isActive = true;
    const setSafeStatus = (next: "pending" | "ok" | "error") => {
      if (isActive) setStatus(next);
    };
    const setSafeMessage = (next: string) => {
      if (isActive) setMessage(next);
    };

    const run = async () => {
      const searchParams = new URLSearchParams(window.location.search);
      const hashRaw = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
      const hashParams = new URLSearchParams(hashRaw);

      const tokenHash = searchParams.get("token_hash") || searchParams.get("token") || hashParams.get("token_hash") || hashParams.get("token");
      const accessToken = hashParams.get("access_token") || searchParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token") || searchParams.get("refresh_token");
      const authCode = searchParams.get("code") || hashParams.get("code");
      const error = searchParams.get("error") || hashParams.get("error");
      const errorDescription = searchParams.get("error_description") || hashParams.get("error_description");
      const email = searchParams.get("email") || hashParams.get("email") || "";
      const type = (searchParams.get("type") as any) || (hashParams.get("type") as any);
      const isRecovery = type === "recovery" || window.location.hash.includes("type=recovery") || window.location.search.includes("type=recovery");
      const supabase = getSupabase();

      const redirectAfterSuccess = async (recovery: boolean, fallbackEmail: string) => {
        if (recovery) {
          setSafeStatus("ok");
          setSafeMessage("Link potvrđen. Molimo postavite novu lozinku...");
          let finalEmail = fallbackEmail;
          try {
            const result = await Promise.race([
              supabase.auth.getUser(),
              new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 2500))
            ]) as any;
            if (result?.data?.user?.email) {
              finalEmail = result.data.user.email;
            }
          } catch {}
          const redirectUrl = `/auth?mode=update${finalEmail ? `&email=${encodeURIComponent(finalEmail)}` : ""}`;
          window.location.replace(redirectUrl);
          return;
        }

        setSafeStatus("ok");
        setSafeMessage("Uspješno potvrđeno! Preusmjeravamo vas...");
        window.location.replace("/profile?email_verified=1");
      };

      if (error || errorDescription) {
        setSafeStatus("error");
        const detail = errorDescription ? decodeURIComponent(errorDescription) : error;
        setSafeMessage(`Greška pri potvrdi: ${detail || "Nevažeći link"}`);
        setTimeout(() => {
          window.location.replace(isRecovery ? "/auth?mode=forgot" : "/auth?mode=signin");
        }, 2200);
        return;
      }

      if (authCode) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(authCode);
        if (exchangeError) {
          setSafeStatus("error");
          setSafeMessage(`Greška pri potvrdi: ${exchangeError.message}`);
          return;
        }
        await redirectAfterSuccess(isRecovery, email);
        return;
      }

      if (accessToken && refreshToken) {
        const { error: setSessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });
        if (setSessionError) {
          setSafeStatus("error");
          setSafeMessage(`Greška sesije: ${setSessionError.message}`);
          return;
        }
        await redirectAfterSuccess(isRecovery, email);
        return;
      }

      if (tokenHash) {
        const finalType = isRecovery ? "recovery" : (type || "signup");
        try {
          const { data, error: verifyError } = await supabase.auth.verifyOtp({ type: finalType, token_hash: tokenHash } as any);
          if (verifyError) {
            setSafeStatus("error");
            setSafeMessage(`Greška pri potvrdi: ${verifyError.message}`);
            return;
          }
          await redirectAfterSuccess(isRecovery, email || data?.user?.email || "");
          return;
        } catch (err: any) {
          setSafeStatus("error");
          setSafeMessage(`Greška sustava: ${err.message || "Nepoznata greška"}`);
          return;
        }
      }

      if (email) {
        setSafeStatus("pending");
        setSafeMessage("Pripremamo vašu sesiju. Molimo pričekajte...");
        try {
          const result = await Promise.race([
            supabase.auth.getSession(),
            new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 4000))
          ]) as any;
          const session = result?.data?.session;
          if (session) {
            await redirectAfterSuccess(isRecovery, email);
            return;
          }
          setSafeStatus("ok");
          setSafeMessage("Email je zaprimljen. Molimo prijavite se sada sa svojom lozinkom.");
          setTimeout(() => {
            window.location.replace("/auth?mode=signin&email=" + encodeURIComponent(email));
          }, 2000);
          return;
        } catch {
          setSafeStatus("error");
          setSafeMessage("Nismo uspjeli potvrditi sesiju. Pokušajte ponovo iz email linka.");
          setTimeout(() => {
            window.location.replace(isRecovery ? "/auth?mode=forgot" : "/auth?mode=signin");
          }, 2200);
          return;
        }
      }

      setSafeStatus("error");
      if (isRecovery) {
        setSafeMessage("Link za promjenu lozinke je nevažeći ili je istekao. Zatražite novi email.");
        setTimeout(() => {
          window.location.replace("/auth?mode=forgot");
        }, 2200);
      } else {
        setSafeMessage("Link je nevažeći. Vraćamo vas na prijavu.");
        setTimeout(() => {
          window.location.replace("/auth?mode=signin");
        }, 2200);
      }
    };

    run();
    return () => {
      isActive = false;
    };
  }, [t]);
   return (
     <div className="flex h-full bg-white">
       <div className="flex-1 flex items-center justify-center">
         <div className="w-full max-w-md mx-auto px-6 text-center">
           <div className="mb-8">
             <span className="text-sm font-semibold tracking-tight text-black">PayParq</span>
           </div>
           <div className={`text-sm ${status === "error" ? "text-red-600" : "text-gray-700"}`}>{message}</div>
         </div>
       </div>
     </div>
   );
 }
