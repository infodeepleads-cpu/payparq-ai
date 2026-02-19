 "use client";
 import { useState } from "react";
 
 const models = [
   { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
   { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
   { value: "groq/compound-mini", label: "Groq Compound Mini" },
   { value: "llama-3.1-8b-instant", label: "Llama 3.1 8B (Groq)" },
   { value: "llama-3.3-70b-versatile", label: "Llama 3.3 70B (Groq)" },
   { value: "meta-llama/llama-4-maverick-17b-128e-instruct", label: "Llama 4 Maverick 17B (Groq)" },
   { value: "meta-llama/llama-4-scout-17b-16e-instruct", label: "Llama 4 Scout 17B (Groq)" },
   { value: "meta-llama/llama-guard-4-12b", label: "Llama Guard 4 12B (Groq)" },
   { value: "meta-llama/llama-prompt-guard-2-22m", label: "Prompt Guard 2 22M (Groq)" },
   { value: "meta-llama/llama-prompt-guard-2-86m", label: "Prompt Guard 2 86M (Groq)" },
   { value: "moonshotai/kimi-k2-instruct", label: "Kimi K2 Instruct (Groq)" },
   { value: "moonshotai/kimi-k2-instruct-0905", label: "Kimi K2 0905 (Groq)" },
   { value: "openai/gpt-oss-120b", label: "OpenAI GPT-OSS 120B" },
   { value: "openai/gpt-oss-20b", label: "OpenAI GPT-OSS 20B" },
   { value: "openai/gpt-oss-safeguard-20b", label: "OpenAI Safeguard 20B" },
   { value: "qwen/qwen3-32b", label: "Qwen3 32B" }
 ];
 
 export default function ModelsPanel() {
   const [selected, setSelected] = useState(models[0].value);
   return (
     <div className="hidden md:flex flex-col h-full bg-white border-l border-gray-100 p-4 w-[30%]">
       <div className="text-sm font-semibold mb-3">Models</div>
       <div className="space-y-2 overflow-y-auto">
         {models.map(m => (
           <label key={m.value} className="flex items-center justify-between gap-2 p-2 rounded-md border border-gray-200 hover:border-gray-300 cursor-pointer">
             <span className="text-xs text-gray-800">{m.label}</span>
             <input
               type="radio"
               name="model"
               value={m.value}
               checked={selected === m.value}
               onChange={(e) => setSelected(e.target.value)}
               className="accent-black"
             />
           </label>
         ))}
       </div>
     </div>
   );
 }
