 "use client";
 import { useEffect, useState } from "react";
 import { getSupabase } from "../../../lib/supabase";
 export const dynamic = "force-dynamic";
 export default function Confirm() {
   const [status, setStatus] = useState<"pending" | "ok" | "error">("pending");
   const [message, setMessage] = useState<string>("Confirming your email…");
   useEffect(() => {
     const params = new URLSearchParams(window.location.search);
     const token_hash = params.get("token_hash");
     const email = params.get("email");
     if (!token_hash || !email) {
       setStatus("error");
       setMessage("Missing confirmation details.");
       return;
     }
     const supabase = getSupabase();
     supabase.auth.verifyOtp({ type: "email", token_hash, email }).then(({ data, error }) => {
       if (error) {
         setStatus("error");
         setMessage(error.message);
       } else {
         setStatus("ok");
         setMessage("Email confirmed. You can close this tab.");
         setTimeout(() => {
           window.location.href = "/auth";
         }, 1500);
       }
     });
   }, []);
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
