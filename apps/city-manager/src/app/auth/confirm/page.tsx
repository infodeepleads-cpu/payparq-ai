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
    const searchParams = new URLSearchParams(window.location.search);
    const hashRaw = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
    const hashParams = new URLSearchParams(hashRaw);
    
    // Log parameters for debugging
    console.log("Confirm Page Params:", {
      search: Object.fromEntries(searchParams.entries()),
      hash: Object.fromEntries(hashParams.entries())
    });

    const token_hash = searchParams.get("token_hash") || searchParams.get("token") || hashParams.get("token_hash") || hashParams.get("token");
    const accessToken = hashParams.get("access_token") || searchParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token") || searchParams.get("refresh_token");
    const error = searchParams.get("error") || hashParams.get("error");
    const errorDescription = searchParams.get("error_description") || hashParams.get("error_description");
    
    const email = searchParams.get("email") || hashParams.get("email") || undefined;
    const type = (searchParams.get("type") as any) || (hashParams.get("type") as any);
    
    // Recovery detection logic
    const isRecovery = type === "recovery" || 
                      window.location.hash.includes("type=recovery") || 
                      window.location.search.includes("type=recovery") ||
                      window.location.hash.includes("recovery");

    const supabase = getSupabase();

    // If we have an access token, it means Supabase already verified the link and signed us in
    if (accessToken || refreshToken) {
      console.log("Detected active session tokens, checking flow type...");
      setStatus("ok");
      
      // If it's a recovery flow, redirect to update password
      if (isRecovery) {
        setMessage("Link potvrđen. Molimo postavite novu lozinku...");
        
        const handleRecoveryRedirect = async () => {
          let finalEmail = email;
          
          if (!finalEmail) {
            try {
              const { data: { user } } = await supabase.auth.getUser();
              finalEmail = user?.email || undefined;
              console.log("Fetched email from session:", finalEmail);
            } catch (e) {
              console.error("Error getting user from session:", e);
            }
          }
          
          const redirectUrl = `/auth?mode=update${finalEmail ? `&email=${encodeURIComponent(finalEmail)}` : ""}`;
          console.log("Redirecting to Recovery Update:", redirectUrl);
          window.location.replace(redirectUrl);
        };
        
        handleRecoveryRedirect();
      } else {
        setMessage("Uspješno potvrđeno! Preusmjeravamo vas...");
        setTimeout(() => {
          window.location.href = "/profile";
        }, 1000);
      }
      return;
    }

    // ... rest of errors ...
    if (error || errorDescription) {
      // ...
    }

    if (token_hash) {
      const finalType = isRecovery ? "recovery" : (type || "signup");
      console.log("Verifying OTP with type:", finalType);
      
      supabase.auth.verifyOtp({ type: finalType, token_hash } as any).then(({ data, error }) => {
        if (error) {
          setStatus("error");
          setMessage(`Greška pri potvrdi: ${error.message}`);
        } else {
          setStatus("ok");
          if (isRecovery) {
            setMessage("Lozinka je spremna za promjenu. Preusmjeravamo vas...");
            setTimeout(() => {
              const finalEmail = email || data.user?.email || "";
              window.location.replace(`/auth?mode=update${finalEmail ? `&email=${encodeURIComponent(finalEmail)}` : ""}`);
            }, 1000);
          } else {
            setMessage("Vaš email je uspješno potvrđen. Preusmjeravamo vas na profil...");
            setTimeout(() => {
              window.location.replace("/profile");
            }, 1000);
          }
        }
      });
      return;
    }

    if (email && !token_hash) {
      setStatus("pending");
      setMessage("Pripremamo vašu sesiju. Molimo pričekajte...");
      
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setStatus("ok");
          setMessage("Uspješno potvrđeno! Dobrodošli natrag.");
          setTimeout(() => {
            window.location.href = "/profile";
          }, 2000);
        } else {
          setStatus("ok");
          setMessage("Email je zaprimljen. Molimo prijavite se sada sa svojom lozinkom.");
          setTimeout(() => {
            window.location.href = "/auth?mode=signin&email=" + encodeURIComponent(email);
          }, 3000);
        }
      });
      return;
    }
    
    if (!token_hash) {
      if (type === "recovery") {
        setStatus("error");
        setMessage("Link za promjenu lozinke je nevažeći ili je istekao. Zatražite novi email.");
        setTimeout(() => {
          window.location.href = "/auth?mode=forgot";
        }, 2500);
      } else {
        setStatus("error");
        setMessage("Link je nevažeći. Vraćamo vas na prijavu.");
        setTimeout(() => {
          window.location.href = "/auth?mode=signin";
        }, 2000);
      }
    }
  }, [t]);
   return (
     <div className="flex h-full bg-white">
       <div className="flex-1 flex items-center justify-center">
         <div className="w-full max-w-md mx-auto px-6 text-center">
           <div className="mb-8">
             <span className="text-sm font-semibold tracking-tight text-black">machine.io</span>
           </div>
           <div className={`text-sm ${status === "error" ? "text-red-600" : "text-gray-700"}`}>{message}</div>
         </div>
       </div>
     </div>
   );
 }
