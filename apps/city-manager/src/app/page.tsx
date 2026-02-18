"use client";
import { useState, useRef, useEffect } from "react";
import ChatMessage from "../components/ChatMessage";

type SuggestResponse = {
  nextStep: string;
  whatsappDraft: string;
  emailDraft: string;
  urgent: boolean;
};

type Message = { role: "user" | "assistant"; content: string };

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const THREADS_KEY = "pp_chat_threads";
  const CURRENT_KEY = "pp_current_thread";
  const MSG_PREFIX = "pp_chat_messages_";

  const readThreads = () => {
    try {
      const raw = localStorage.getItem(THREADS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };
  const writeThreads = (threads: any[]) => {
    localStorage.setItem(THREADS_KEY, JSON.stringify(threads));
  };
  const setCurrent = (id: string | null) => {
    if (id) localStorage.setItem(CURRENT_KEY, id);
    else localStorage.removeItem(CURRENT_KEY);
    window.dispatchEvent(new CustomEvent("pp-current-thread", { detail: { id } }));
  };
  const loadMessages = (id: string | null) => {
    setThreadId(id);
    if (!id) {
      setMessages([]);
      return;
    }
    try {
      const raw = localStorage.getItem(MSG_PREFIX + id);
      const parsed: Message[] = raw ? JSON.parse(raw) : [];
      setMessages(parsed);
    } catch {
      setMessages([]);
    }
  };
  const saveMessages = (id: string, msgs: Message[]) => {
    localStorage.setItem(MSG_PREFIX + id, JSON.stringify(msgs));
  };
  const ensureThread = (titleSeed?: string) => {
    let id = localStorage.getItem(CURRENT_KEY);
    if (!id) {
      const t = {
        id: String(Date.now()),
        title: titleSeed?.trim() || "Untitled",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      const threads = readThreads();
      threads.unshift(t);
      writeThreads(threads);
      id = t.id;
      setCurrent(id);
    }
    return id;
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const init = () => {
      const cur = localStorage.getItem(CURRENT_KEY);
      loadMessages(cur);
    };
    init();
    const handler = (e: any) => {
      const id = e?.detail?.id ?? localStorage.getItem(CURRENT_KEY);
      loadMessages(id);
    };
    window.addEventListener("pp-current-thread", handler);
    return () => window.removeEventListener("pp-current-thread", handler);
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    
    const userText = input.trim();
    setInput("");
    setError(null);
    setLoading(true);

    const id = ensureThread(userText);
    const userMsg: Message = { role: "user", content: userText };
    const nextUserMsgs: Message[] = [...messages, userMsg];
    setMessages(nextUserMsgs);
    saveMessages(id, nextUserMsgs);

    try {
      const r = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: userText })
      });
      
      if (!r.ok) throw new Error("Failed to get suggestion");
      
      const data: SuggestResponse = await r.json();
      const assistantText = `Here is a suggestion:\n\n${data.nextStep}\n\n**Draft for WhatsApp:**\n${data.whatsappDraft}\n\n**Draft for Email:**\n${data.emailDraft}`;
      
      const assistantMsg: Message = { role: "assistant", content: assistantText };
      const nextMsgs: Message[] = [...nextUserMsgs, assistantMsg];
      setMessages(nextMsgs);
      if (id) {
        saveMessages(id, nextMsgs);
        const threads = readThreads();
        const idx = threads.findIndex((t: any) => t.id === id);
        if (idx >= 0) {
          threads[idx] = {
            ...threads[idx],
            title: threads[idx].title === "Untitled" ? userText.slice(0, 48) : threads[idx].title,
            updatedAt: Date.now(),
          };
          writeThreads(threads);
          window.dispatchEvent(new Event("storage"));
        }
      }
      
      if (data.urgent) {
        try {
          const reg = await navigator.serviceWorker.ready;
          await reg.showNotification("Immediate Action", {
            body: data.nextStep,
            icon: "/icons/icon-192.png",
            data: { url: "/" }
          });
        } catch (e) {
          console.error("Push notification failed", e);
        }
      }
    } catch (e: any) {
      setError(e.message ?? "Error processing request");
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const InputArea = ({ centered = false }) => (
    <div className={`w-full max-w-3xl mx-auto px-6 md:px-0 transition-all duration-300 ${centered ? 'scale-100 md:translate-y-2' : ''}`}>
      <div className="relative flex items-center w-full pl-3 pr-3 py-2 bg-white border border-gray-100 shadow-pill rounded-full focus-within:ring-0 focus-within:outline-none">
         <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
           <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
         </svg>
         <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Ask anything..."
            className="flex-1 py-1.5 px-2 bg-transparent border-0 focus:ring-0 focus:outline-none text-sm text-black placeholder:text-gray-500 font-normal leading-tight self-center"
            autoFocus
          />
         <div className="flex items-center gap-4">
            <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3a3 3 0 013 3v6a3 3 0 11-6 0V6a3 3 0 013-3zm7 9a7 7 0 01-14 0m7 7v3" />
            </svg>
            <button
               onClick={sendMessage}
               disabled={!input.trim() || loading}
               className={`transition-all duration-200 rounded-full border focus:outline-none ${
                 input.trim() 
                   ? "border-gray-300 text-black hover:border-gray-400" 
                   : "border-gray-200 text-gray-400 cursor-not-allowed"
               } p-1.5`}
            >
               <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                 <path d="M12 19V5m-7 7l7-7 7 7" strokeLinecap="round" strokeLinejoin="round"/>
               </svg>
            </button>
         </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-white relative">
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-sm border-b border-gray-100 md:hidden">
        <div className="max-w-3xl mx-auto px-4 md:px-0 py-3">
          <span className="text-sm font-semibold tracking-tight text-black">machine.io</span>
        </div>
      </div>
      {!threadId || messages.length === 0 ? (
        <div className="flex items-center justify-center h-full px-4">
           <InputArea centered={true} />
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto pb-40 pt-8">
            <div className="flex flex-col space-y-8">
              {messages.map((m, i) => (
                <ChatMessage key={i} role={m.role} content={m.content} />
              ))}
              {loading && (
                 <div className="w-full py-8">
                   <div className="max-w-3xl mx-auto flex gap-6 px-4 md:px-0">
                      <div className="w-8 h-8 rounded-sm bg-black flex items-center justify-center animate-pulse">
                        <span className="text-white text-xs font-bold">P</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-gray-400 text-sm">Thinking...</span>
                      </div>
                   </div>
                 </div>
              )}
              {error && (
                <div className="w-full py-4 text-center">
                   <span className="text-red-500 text-sm bg-red-50 px-4 py-2 rounded-full border border-red-100">{error}</span>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </div>

          <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-white via-white to-transparent pt-10 pb-8 z-10">
             <InputArea />
             <p className="text-center text-xs text-gray-400 mt-3">
                payparq.ai can make mistakes. Consider checking important information.
             </p>
          </div>
        </>
      )}
    </div>
  );
}
