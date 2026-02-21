import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

export default function ChatMessage({
  role,
  content,
  attachment,
  animate = false,
}: {
  role: "user" | "assistant" | "system";
  content: string;
  attachment?: string;
  animate?: boolean;
}) {
  const isUser = role === "user";
  const isSystem = role === "system";
  const [displayedContent, setDisplayedContent] = useState(isUser || !animate ? content : "");

  useEffect(() => {
    if (isUser || isSystem || !animate) {
      setDisplayedContent(content);
      return;
    }

    setDisplayedContent(""); // Reset immediately to prevent ghosting
    let index = 0;
    const timer = setInterval(() => {
      if (index < content.length) {
        setDisplayedContent((prev) => content.slice(0, index + 1));
        index++;
      } else {
        clearInterval(timer);
      }
    }, 10); // Fast typing speed

    return () => clearInterval(timer);
  }, [content, isUser, animate]);

  return (
    <div className="w-full bg-transparent">
      {isSystem ? (
        <div className="flex w-full justify-center">
          <div className="inline-block max-w-[85%] rounded-lg px-3 py-2 bg-green-50 text-green-700 border border-green-200 text-sm">
            {displayedContent}
          </div>
        </div>
      ) : (
        <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
          {attachment && (
            <div className="mb-2">
              <img 
                src={attachment} 
                alt="Uploaded attachment" 
                className="max-w-full h-auto rounded-lg border border-gray-200 shadow-sm max-h-60 object-contain"
              />
            </div>
          )}
          <div className={`inline-block max-w-[85%] rounded-2xl px-4 py-3 ${isUser ? "bg-[#ececf1] text-black" : "bg-white text-gray-800 border border-gray-200"}`}>
            <div className="whitespace-pre-wrap leading-7">
              {isUser ? (
                displayedContent
              ) : (
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
                    li: ({ children }) => <li className="mb-1">{children}</li>,
                    strong: ({ children }) => <span className="font-semibold">{children}</span>,
                  }}
                >
                  {displayedContent}
                </ReactMarkdown>
              )}
              {!isUser && displayedContent.length < content.length && (
                <span className="inline-block w-1.5 h-4 ml-1 align-middle bg-gray-400 animate-pulse"></span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
