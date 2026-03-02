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
    const token_hash = searchParams.get("token_hash") || searchParams.get("token") || hashParams.get("token_hash") || hashParams.get("token");
    const email = searchParams.get("email") || hashParams.get("email") || undefined;
    const type = (searchParams.get("type") as any) || (hashParams.get("type") as any) || "signup";
    
    const supabase = getSupabase();

    if (token_hash) {
      supabase.auth.verifyOtp({ type, token_hash } as any).then(({ data, error }) => {
        if (error) {
          setStatus("error");
          setMessage(`Greška pri potvrdi: ${error.message}`);
        } else {
          setStatus("ok");
          if (type === "recovery") {
            setMessage("Lozinka je spremna za promjenu. Preusmjeravamo vas...");
            setTimeout(() => {
              window.location.href = "/auth?mode=update";
            }, 2000);
          } else {
            setMessage("Vaš email je uspješno potvrđen. Preusmjeravamo vas na profil...");
            setTimeout(() => {
              window.location.href = "/profile";
            }, 2000);
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
