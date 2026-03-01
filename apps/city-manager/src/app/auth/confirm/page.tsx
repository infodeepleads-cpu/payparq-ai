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
    const params = new URLSearchParams(window.location.search);
    const token_hash = params.get("token_hash");
    const email = params.get("email");
    
    const supabase = getSupabase();

    // 1. If we have token_hash (Magic Link clicked), verify it
    if (token_hash && email) {
      supabase.auth.verifyOtp({ type: "email", token_hash, email }).then(({ data, error }) => {
        if (error) {
          setStatus("error");
          setMessage(error.message);
        } else {
          setStatus("ok");
          setMessage("Vaš email je uspješno potvrđen. Preusmjeravamo vas...");
          setTimeout(() => {
            window.location.href = "/map?show_chat=true";
          }, 2000);
        }
      });
      return;
    }

    // 2. If we only have email (from our custom link), we can try to sign in via Magic Link
    // or tell user that Supabase confirmation link is actually in the background
    if (email && !token_hash) {
      setStatus("pending");
      setMessage("Pripremamo vašu sesiju. Molimo pričekajte...");
      
      // We check if session exists (Supabase sometimes auto-confirms if link is direct)
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setStatus("ok");
          setMessage("Uspješno potvrđeno! Dobrodošli natrag.");
          setTimeout(() => {
            window.location.href = "/map?show_chat=true";
          }, 2000);
        } else {
          // If no session, they might need to use the actual Supabase link
          // but for this flow, we'll assume they just need to sign in
          setStatus("ok");
          setMessage("Molimo prijavite se sada sa svojom lozinkom.");
          setTimeout(() => {
            window.location.href = "/auth?mode=signin";
          }, 2000);
        }
      });
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
