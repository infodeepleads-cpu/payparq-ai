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
    if (!token_hash || !email) {
      setStatus("error");
      setMessage(t('missing_confirmation_details'));
      return;
    }
    const supabase = getSupabase();
    supabase.auth.verifyOtp({ type: "email", token_hash, email }).then(({ data, error }) => {
      if (error) {
        setStatus("error");
        setMessage(error.message);
      } else {
        setStatus("ok");
        setMessage(t('email_confirmed_close'));
        setTimeout(() => {
          window.location.href = "/auth";
        }, 1500);
      }
    });
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
