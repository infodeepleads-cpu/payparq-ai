"use client";
import React, { useState } from "react";

export default function BrowserPage() {
  const [url, setUrl] = useState("https://www.payparq.com");
  const [inputUrl, setInputUrl] = useState("https://www.payparq.com");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const finalUrl = inputUrl.startsWith("http") ? inputUrl : `https://${inputUrl}`;
    setUrl(finalUrl);
    // Reset loading after a short delay to simulate page load
    setTimeout(() => setIsLoading(false), 1500);
  };

  const handleRefresh = () => {
    setIsLoading(true);
    const current = url;
    setUrl(""); // Force refresh
    setTimeout(() => {
        setUrl(current);
        setIsLoading(false);
    }, 100);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Modern Browser Toolbar */}
      <div className="flex items-center gap-3 px-4 py-3 bg-sidebar border-b border-gray-200 shadow-sm sticky top-0 z-10">
        
        {/* Navigation Controls (Visual Only) */}
        <div className="flex items-center gap-1 text-gray-400 shrink-0">
            <button className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50" disabled>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50" disabled>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
            <button onClick={handleRefresh} className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors">
                <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            </button>
        </div>

        {/* Address Bar */}
        <form onSubmit={handleSubmit} className="flex-1 max-w-3xl mx-auto relative group min-w-0 mr-12">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-gray-400 group-focus-within:text-black transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
          <input
            name="url"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            className="block w-full pl-10 pr-4 py-2.5 text-sm bg-gray-100 border-transparent rounded-full focus:bg-white focus:border-gray-300 focus:ring-2 focus:ring-gray-100 focus:outline-none transition-all font-medium text-gray-700 placeholder-gray-400 shadow-inner"
            placeholder="Search or enter website name"
          />
        </form>

        {/* Window Controls / Extras */}
        <div className="flex items-center gap-2 text-gray-400 w-[88px] justify-end shrink-0">
            <button className="p-2 rounded-full hover:bg-gray-100 hover:text-gray-600 transition-colors" title="Bookmark">
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
            </button>
            <button className="p-2 rounded-full hover:bg-gray-100 hover:text-gray-600 transition-colors" title="Menu">
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
            </button>
        </div>
      </div>

      {/* Browser Viewport */}
      <div className="flex-1 relative bg-white">
        {isLoading && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-gray-100 z-20">
                <div className="h-full bg-black animate-progress origin-left"></div>
            </div>
        )}
        <iframe
          src={url}
          className="w-full h-full border-none bg-white"
          title="Embedded Browser"
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          onLoad={() => setIsLoading(false)}
        />
      </div>
      
      <style jsx>{`
        @keyframes progress {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }
        .animate-progress {
          animation: progress 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
