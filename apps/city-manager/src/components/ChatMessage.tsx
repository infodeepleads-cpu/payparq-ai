import { useState } from 'react';

export default function ChatMessage({ role, content }: { role: "user" | "assistant"; content: string }) {
  const isUser = role === "user";
  
  return (
    <div className={`w-full group bg-transparent`}>
      <div className="max-w-3xl mx-auto flex gap-6 px-6 md:px-0">
        <div className="flex-shrink-0 flex flex-col relative items-end">
          {isUser ? (
            <div className="w-8 h-8 rounded-sm bg-[#ececf1] flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-sm bg-black flex items-center justify-center">
              <span className="text-white text-xs font-bold">P</span>
            </div>
          )}
        </div>
        
        <div className="relative flex-1 overflow-hidden">
          <div className="prose prose-sm max-w-none text-gray-800 leading-7">
            {isUser ? (
              <p className="whitespace-pre-wrap text-black">{content}</p>
            ) : (
              <div className="whitespace-pre-wrap text-gray-800">{content}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
