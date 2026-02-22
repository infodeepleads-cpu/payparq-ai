import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

const CopyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
  </svg>
);

const WhatsAppIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

const EmailIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0 1.1.9 2 2 2z"></path>
    <polyline points="22,6 12,13 2,6"></polyline>
  </svg>
);

const MessageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
  </svg>
);

const PhoneIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
  </svg>
);

const processTextWithPhoneNumbers = (text: string) => {
  // Regex to match phone numbers (flexible pattern)
  // Matches: +1-555-555-5555, (555) 555-5555, 555 555 5555, etc.
  const phoneRegex = /(\+?[\d\s\-.()]{7,}\d)/g;
  
  const parts = text.split(phoneRegex);
  const matches = text.match(phoneRegex);
  
  if (!matches) return text;

  return parts.reduce((acc: React.ReactNode[], part, i) => {
    // If this part is a phone number (checked by verifying if it was in matches)
    // Note: split with capturing group includes the separator in the result array
    if (matches.includes(part)) {
      const cleanNumber = part.replace(/[^\d+]/g, '');
      if (cleanNumber.length >= 7) { // Minimal validation
        acc.push(
          <span key={i} className="inline-flex items-center gap-1">
            {part}
            <a 
              href={`tel:${cleanNumber}`} 
              className="inline-flex items-center justify-center w-5 h-5 bg-green-100 text-green-600 rounded-full hover:bg-green-200 transition-colors"
              title="Call"
              onClick={(e) => e.stopPropagation()}
            >
              <PhoneIcon />
            </a>
          </span>
        );
        return acc;
      }
    }
    acc.push(part);
    return acc;
  }, []);
};

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
  const [copied, setCopied] = useState(false);

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

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(content)}`, '_blank');
  };

  const handleEmail = () => {
    window.location.href = `mailto:?body=${encodeURIComponent(content)}`;
  };

  const handleMessage = () => {
    window.location.href = `sms:?body=${encodeURIComponent(content)}`;
  };

  const ActionButton = ({ icon: Icon, onClick, label }: { icon: any, onClick: () => void, label: string }) => (
    <button 
      onClick={onClick}
      className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors bg-transparent border-none outline-none focus:outline-none focus:ring-0 active:bg-transparent"
      title={label}
    >
      <Icon />
    </button>
  );

  return (
    <div className="w-full bg-transparent group">
      {isSystem ? (
        <div className="flex w-full justify-center">
          <div className="inline-block max-w-[85%] rounded-lg px-3 py-2 bg-green-50 text-green-700 border border-green-200 text-sm">
            {displayedContent}
          </div>
        </div>
      ) : (
        <div className={`flex w-full flex-col ${isUser ? 'items-end' : 'items-start'}`}>
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
                  processTextWithPhoneNumbers(displayedContent)
                ) : (
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p className="mb-2 last:mb-0">{Array.isArray(children) ? children.map((child, i) => typeof child === 'string' ? <span key={i}>{processTextWithPhoneNumbers(child)}</span> : child) : (typeof children === 'string' ? processTextWithPhoneNumbers(children) : children)}</p>,
                      ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
                      li: ({ children }) => <li className="mb-1">{Array.isArray(children) ? children.map((child, i) => typeof child === 'string' ? <span key={i}>{processTextWithPhoneNumbers(child)}</span> : child) : (typeof children === 'string' ? processTextWithPhoneNumbers(children) : children)}</li>,
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
          
          {/* Action Buttons */}
          <div className={`flex items-center gap-1 mt-1 ${isUser ? 'mr-1' : 'ml-1'} opacity-100 transition-opacity`}>
            <ActionButton icon={copied ? () => <span className="text-xs font-bold">✓</span> : CopyIcon} onClick={handleCopy} label="Copy" />
            <ActionButton icon={WhatsAppIcon} onClick={handleWhatsApp} label="Share on WhatsApp" />
            <ActionButton icon={EmailIcon} onClick={handleEmail} label="Share via Email" />
            <ActionButton icon={MessageIcon} onClick={handleMessage} label="Share via Messages" />
          </div>
        </div>
      )}
    </div>
  );
}
