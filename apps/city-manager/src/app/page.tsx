"use client";
import { useState, useRef, useEffect } from "react";
import ChatMessage from "../components/ChatMessage";
import { getSupabase } from "../lib/supabase";

type SuggestResponse = {
  nextStep: string;
  whatsappDraft: string;
  emailDraft: string;
  urgent: boolean;
};

type Message = { role: "user" | "assistant"; content: string; attachment?: string };

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState("gemini-2.5-flash");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    const pasteHandler = (e: any) => {
      const text = e?.detail?.text ?? "";
      setInput(text);
      inputRef.current?.focus();
    };
    window.addEventListener("pp-set-input", pasteHandler);

    try {
      const supabase = getSupabase();
      supabase.auth.getUser().then(({ data }) => {
        const u = data?.user;
        const name =
          (u?.user_metadata as any)?.name ||
          (u?.user_metadata as any)?.full_name ||
          u?.email ||
          null;
        setUserName(name);
      });
    } catch {
      // ignore if supabase not configured
    }
    return () => window.removeEventListener("pp-current-thread", handler);
  }, []);

  const sendMessage = async () => {
    if ((!input.trim() && !selectedImage) || loadingRef.current) return;
    
    const userText = input.trim();
    const image = selectedImage;
    
    setInput("");
    setSelectedImage(null);
    setError(null);
    setLoading(true);
    loadingRef.current = true;

    const id = ensureThread(userText || "Image Upload");
    const userMsg: Message = { role: "user", content: userText, attachment: image || undefined };
    const nextUserMsgs: Message[] = [...messages, userMsg];
    setMessages(nextUserMsgs);
    saveMessages(id!, nextUserMsgs);

    try {
      const r = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: userText, image, messages: nextUserMsgs, model: selectedModel })
      });
      
      if (!r.ok) throw new Error("Failed to get suggestion");
      
      const data: SuggestResponse = await r.json();
      let assistantText = data.nextStep;
      
      if (data.whatsappDraft) {
        assistantText += `\n\n**Draft for WhatsApp:**\n${data.whatsappDraft}`;
      }
      
      if (data.emailDraft) {
        assistantText += `\n\n**Draft for Email:**\n${data.emailDraft}`;
      }
      
      const finalMsgs: Message[] = [...nextUserMsgs, { role: "assistant", content: assistantText }];
      setMessages(finalMsgs);
      if (id) {
        saveMessages(id, finalMsgs);
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
          // silently ignore push notification failures
        }
      }
    } catch (e: any) {
      setError(e.message ?? "Error processing request");
      setMessages((prev) => {
        const next = prev.slice();
        const idx = prev.length - 1;
        if (idx >= 0 && next[idx]?.role === "assistant") {
          next[idx] = { role: "assistant", content: "Sorry, I encountered an error. Please try again." };
          if (id) saveMessages(id, next);
          return next;
        }
        const appended: Message[] = [...prev, { role: "assistant" as const, content: "Sorry, I encountered an error. Please try again." }];
        if (id) saveMessages(id, appended);
        return appended;
      });
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size too large (max 5MB)");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        inputRef.current?.focus();
      };
      reader.readAsDataURL(file);
    }
  };

  const InputArea = ({ centered = false }: { centered?: boolean }) => (
    <div className={`w-full max-w-3xl mx-auto px-6 md:px-0 transition-all duration-300 ${centered ? 'scale-100 md:translate-y-2' : ''}`}>
      <div className="flex justify-center mb-3">
        <div className="relative">
          <select 
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="appearance-none bg-white border border-gray-200 text-gray-600 text-xs rounded-full pl-3 pr-8 py-1.5 focus:outline-none focus:border-gray-400 hover:border-gray-300 transition-colors shadow-sm cursor-pointer"
          >
            <option value="gemini-2.5-flash">Gemini 2.5 Flash (Recommended)</option>
            <option value="gemini-2.5-pro">Gemini 2.5 Pro (Smartest)</option>
            <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
            <option value="gemini-flash-latest">Gemini 1.5 Flash</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
            <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
          </div>
        </div>
      </div>
      {selectedImage && (
        <div className="relative mb-2 w-fit">
          <img src={selectedImage} alt="Selected" className="h-20 rounded-lg border border-gray-200 shadow-sm" />
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute -top-2 -right-2 bg-gray-900 text-white rounded-full p-0.5 hover:bg-black transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      <div className="relative flex items-center w-full pl-3 pr-3 py-2 bg-white border border-gray-100 shadow-pill rounded-full focus-within:ring-0 focus-within:outline-none">
         <button
           onClick={() => fileInputRef.current?.click()}
           className="bg-transparent border-0 p-0 focus:outline-none mr-2"
           title="Upload image"
         >
           <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
             <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
           </svg>
         </button>
         <input
           type="file"
           ref={fileInputRef}
           className="hidden"
           accept="image/*"
           onChange={handleFileSelect}
         />
         <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Ask anything..."
            className="flex-1 py-1.5 px-2 bg-transparent border-0 focus:ring-0 focus:outline-none text-sm text-black placeholder:text-gray-500 font-normal leading-tight self-center"
            autoFocus
            ref={inputRef}
          />
         <div className="flex items-center gap-3">
            <button
               onClick={sendMessage}
               disabled={(!input.trim() && !selectedImage) || loading}
               className={`order-1 md:order-2 transition-all duration-200 rounded-full border focus:outline-none ${
                 input.trim() || selectedImage
                   ? "border-gray-300 text-black hover:border-gray-400" 
                   : "border-gray-200 text-gray-400 cursor-not-allowed"
               } p-1.5`}
               aria-label="Send"
               title="Send"
               data-role="cta"
            >
               <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                 <path d="M12 19V5m-7 7l7-7 7 7" strokeLinecap="round" strokeLinejoin="round"/>
               </svg>
            </button>
            <button
               type="button"
               disabled={loading}
               className="order-2 md:order-1 transition-all duration-200 rounded-full border border-gray-300 text-black hover:border-gray-400 p-1.5 focus:outline-none"
               aria-label="Voice"
               title="Voice"
            >
               <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                 <path strokeLinecap="round" strokeLinejoin="round" d="M12 3a3 3 0 013 3v6a3 3 0 11-6 0V6a3 3 0 013-3zm7 9a7 7 0 01-14 0m7 7v3" />
               </svg>
            </button>
         </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-[100dvh] bg-white relative overflow-hidden">
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-sm border-b border-gray-100 md:hidden">
        <div className="max-w-3xl mx-auto px-4 md:px-0 py-3 flex items-center justify-between">
          <span className="text-sm font-semibold tracking-tight text-black">machine.io</span>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => { window.location.href = "/auth"; }}
              className="text-xs font-medium text-black bg-transparent border-0 p-0"
            >
              Log out
            </button>
          </div>
        </div>
      </div>
      <div className="hidden md:block sticky top-0 z-20 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 md:px-0 py-3 flex items-center justify-between">
          <span className="text-sm font-semibold tracking-tight text-black">machine.io</span>
          <div className="flex items-center gap-3">
            {userName && <span className="text-xs text-gray-700">{userName}</span>}
            <button 
              onClick={() => { window.location.href = "/auth"; }}
              className="text-xs font-medium text-black bg-transparent border-0 p-0"
            >
              Log out
            </button>
          </div>
        </div>
      </div>
      {!threadId || messages.length === 0 ? (
        <div className="flex items-center justify-center h-full px-4">
           <InputArea centered={true} />
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto pb-40 pt-8 scroll-smooth">
            <div className="max-w-3xl mx-auto px-4 md:px-0">
              <div className="flex flex-col space-y-8">
              {messages.map((m, i) => (
                  <ChatMessage key={i} role={m.role} content={m.content} />
              ))}
              {loading && (
                <div className="w-full py-8">
                  <div className="max-w-3xl mx-auto flex items-center gap-6 px-4 md:px-0">
                    <div className="rounded-full bg-gray-300 animate-pulse" style={{ width: "1cm", height: "1cm" }} />
                    <div className="flex items-center">
                      <span className="text-gray-400 text-sm">Buffering…</span>
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
          </div>

          <div className="fixed bottom-0 left-0 w-full bg-gradient-to-t from-white via-white to-transparent pt-6 pb-[calc(env(safe-area-inset-bottom)+24px)] md:pb-8 z-30 px-4 md:px-0">
             <InputArea />
             <p className="text-center text-xs text-gray-400 mt-3 pb-safe">
                machine.io invites you to challenge it so we can go deeper.
             </p>
          </div>
        </>
      )}
    </div>
  );
}
