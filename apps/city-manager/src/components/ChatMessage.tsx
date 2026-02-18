import { useState } from 'react';

export default function ChatMessage({ role, content }: { role: "user" | "assistant"; content: string }) {
  const isUser = role === "user";
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  };
  
  return (
    <div className="w-full bg-transparent">
      <div className="max-w-3xl mx-auto px-6 md:px-0">
        <div className="inline-block max-w-full">
          <div className={`rounded-2xl px-4 py-3 ${isUser ? "bg-[#ececf1] text-black" : "bg-white text-gray-800 border border-gray-200"}`}>
            <div className="whitespace-pre-wrap leading-7">{content}</div>
          </div>
          <button
            onClick={copy}
            className={`${copied ? "text-green-600" : "text-gray-500 hover:text-black"} mt-2 bg-transparent border-0 p-0 focus:outline-none focus:ring-0`}
            aria-label="Copy"
            title="Copy"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <rect x="3" y="3" width="13" height="13" rx="2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
