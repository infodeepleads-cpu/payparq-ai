"use client";
import { useState, useRef, useEffect } from "react";
import ChatMessage from "../components/ChatMessage";
import { getSupabase } from "../lib/supabase";
import TopControlsWidget from "../components/TopControlsWidget";

type SuggestResponse = {
  nextStep: string;
  urgent: boolean;
  action?: string;
  taskTitle?: string;
  reminderTime?: string;
  crmContact?: any;
};

type Message = { role: "user" | "assistant"; content: string; attachment?: string; animate?: boolean };

export default function MachineIo() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState("auto");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [loadingDots, setLoadingDots] = useState(".");
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [reminders, setReminders] = useState<any[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("pp_reminders");
      if (stored) setReminders(JSON.parse(stored));
    } catch {}
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    const interval = setInterval(() => {
      try {
        const now = Date.now();
        const raw = localStorage.getItem("pp_reminders");
        if (!raw) return;
        const pending = JSON.parse(raw);
        let changed = false;
        pending.forEach((r: any) => {
          if (new Date(r.time).getTime() <= now && !r.fired) {
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification("Reminder", { body: r.title, icon: "/icons/icon-192.png" });
            }
            r.fired = true;
            changed = true;
          }
        });
        if (changed) {
          localStorage.setItem("pp_reminders", JSON.stringify(pending));
          setReminders(pending);
          window.dispatchEvent(new Event("pp_reminders_update"));
        }
      } catch {}
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const AI_MODELS = [
    { id: "auto", name: "Auto (Smart Switch)" },
    { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B (Groq)" },
    { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B (Groq)" },
    { id: "separator-1", name: "──────────", disabled: true },
    { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash" },
    { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro" },
    { id: "groq/compound-mini", name: "Groq Compound Mini" },
    { id: "meta-llama/llama-4-maverick-17b-128e-instruct", name: "Llama 4 Maverick 17B (Groq)" },
    { id: "meta-llama/llama-4-scout-17b-16e-instruct", name: "Llama 4 Scout 17B (Groq)" },
    { id: "meta-llama/llama-guard-4-12b", name: "Llama Guard 4 12B (Groq)" },
    { id: "meta-llama/llama-prompt-guard-2-22m", name: "Prompt Guard 2 22M (Groq)" },
    { id: "meta-llama/llama-prompt-guard-2-86m", name: "Prompt Guard 2 86M (Groq)" },
    { id: "moonshotai/kimi-k2-instruct", name: "Kimi K2 Instruct (Groq)" },
    { id: "moonshotai/kimi-k2-instruct-0905", name: "Kimi K2 Instruct 0905 (Groq)" },
    { id: "openai/gpt-oss-120b", name: "GPT OSS 120B (Groq)" },
    { id: "openai/gpt-oss-20b", name: "GPT OSS 20B (Groq)" },
    { id: "openai/gpt-oss-safeguard-20b", name: "GPT OSS Safeguard 20B (Groq)" },
    { id: "qwen/qwen3-32b", name: "Qwen3 32B (Groq)" },
    { id: "whisper-large-v3", name: "Whisper Large v3 (Groq)" },
    { id: "whisper-large-v3-turbo", name: "Whisper Large v3 Turbo (Groq)" },
  ];

  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setLoadingDots((prev) => (prev.length < 3 ? prev + "." : "."));
    }, 500);
    return () => clearInterval(interval);
  }, [loading]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const THREADS_KEY = "pp_chat_threads";
  const CURRENT_KEY = "pp_current_thread";
  const MSG_PREFIX = "pp_chat_messages_";
  const CRM_KEY = "pp_crm_contacts";
  const TASKS_KEY = "pp_tasks";
  const readCRM = () => {
    try {
      const raw = localStorage.getItem(CRM_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };
  const writeCRM = (contacts: any[]) => {
    localStorage.setItem(CRM_KEY, JSON.stringify(contacts));
    window.dispatchEvent(new Event("crm_storage"));
  };
  const addCRMContact = (contact: any) => {
    const contacts = readCRM();
    const newContact = { ...contact, id: String(Date.now()), createdAt: Date.now() };
    contacts.unshift(newContact);
    writeCRM(contacts);
    return newContact;
  };
  const updateCRMContact = (contact: any) => {
    const contacts = readCRM();
    // Try to find by ID first, then by index, then by decisionMaker name
    let idx = -1;
    if (contact.id) {
      idx = contacts.findIndex((c: any) => c.id === contact.id);
    }
    
    // Check for numeric index (1-based from AI)
    if (idx === -1 && typeof contact.index === 'number') {
      const i = contact.index - 1; // Convert to 0-based
      if (i >= 0 && i < contacts.length) {
        idx = i;
      }
    }

    if (idx === -1 && contact.decisionMaker) {
      idx = contacts.findIndex((c: any) => c.decisionMaker.toLowerCase() === contact.decisionMaker.toLowerCase());
    }
    
    if (idx >= 0) {
      // Exclude 'index' from the actual stored data
      const { index, ...updates } = contact;
      contacts[idx] = { ...contacts[idx], ...updates };
      writeCRM(contacts);
      return contacts[idx];
    }
    return null;
  };

  const readTasks = () => {
    try {
      const raw = localStorage.getItem(TASKS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };
  const writeTasks = (tasks: any[]) => {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    window.dispatchEvent(new Event("storage"));
  };
  const addTaskLocal = (title: string) => {
    const t = { id: String(Date.now()), title, completed: false, confirmed: false, createdAt: Date.now() };
    const tasks = readTasks();
    tasks.unshift(t);
    writeTasks(tasks);
    return t;
  };
  const findTaskIndex = (title: string) => {
    const tasks = readTasks();
    const idx = tasks.findIndex((x: any) => String(x.title).toLowerCase() === title.toLowerCase());
    return { tasks, idx };
  };
  const removeTaskLocal = (title: string) => {
    const { tasks, idx } = findTaskIndex(title);
    if (idx >= 0) {
      const removed = tasks[idx];
      tasks.splice(idx, 1);
      writeTasks(tasks);
      return removed;
    }
    return null;
  };
  const completeTaskLocal = (title: string) => {
    const { tasks, idx } = findTaskIndex(title);
    if (idx >= 0) {
      tasks[idx] = { ...tasks[idx], completed: true };
      writeTasks(tasks);
      return tasks[idx];
    }
    return null;
  };
  const confirmTaskLocal = (title: string) => {
    const { tasks, idx } = findTaskIndex(title);
    if (idx >= 0 && tasks[idx].completed) {
      tasks[idx] = { ...tasks[idx], confirmed: true };
      writeTasks(tasks);
      return tasks[idx];
    }
    return null;
  };
  const parseTaskCommand = (text: string) => {
    const s = text.trim();
    let m = s.match(/^(?:add|create)\s+(?:this\s+)?tas?k[-:]?\s*(.+)$/i);
    if (!m) m = s.match(/^task[-:]?\s*(.+)$/i);
    if (!m) m = s.match(/^add\s+tas?k\s+(.+)$/i);
    if (m) return { type: "add", title: m[1].trim() };
    m = s.match(/^(?:remove|delete)\s+tas?k[-:]?\s*(.+)$/i);
    if (m) return { type: "remove", title: m[1].trim() };
    m = s.match(/^(?:complete|finish|done)\s+tas?k[-:]?\s*(.+)$/i);
    if (m) return { type: "complete", title: m[1].trim() };
    m = s.match(/^confirm\s+tas?k[-:]?\s*(.+)$/i);
    if (m) return { type: "confirm", title: m[1].trim() };
    return null;
  };

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
      // Ensure historical messages do not animate
      setMessages(parsed.map(m => ({ ...m, animate: false })));
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
    const cmd = parseTaskCommand(userText);
    if (cmd) {
      setInput("");
      setSelectedImage(null);
      setError(null);
      const id = ensureThread(userText || "Task");
      const userMsg: Message = { role: "user", content: userText, attachment: image || undefined };
      const nextUserMsgs: Message[] = [...messages, userMsg];
      setMessages(nextUserMsgs);
      saveMessages(id!, nextUserMsgs);
      let resultText = "";
      if (cmd.type === "add") {
        const t = addTaskLocal(cmd.title);
        resultText = `Task added: ${t.title}`;
      } else if (cmd.type === "remove") {
        const r = removeTaskLocal(cmd.title);
        resultText = r ? `Task removed: ${r.title}` : `Task not found: ${cmd.title}`;
      } else if (cmd.type === "complete") {
        const c = completeTaskLocal(cmd.title);
        resultText = c ? `Task completed: ${c.title}` : `Task not found: ${cmd.title}`;
      } else if (cmd.type === "confirm") {
        const c = confirmTaskLocal(cmd.title);
        resultText = c ? `Task confirmed: ${c.title}` : `Complete the task before confirming: ${cmd.title}`;
      }
      const finalMsgs: Message[] = [...nextUserMsgs, { role: "assistant", content: resultText, animate: false }];
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
      return;
    }
    
    setInput("");
    setSelectedImage(null);
    setError(null);
    setLoading(true);
    setLoadingDots(".");
    loadingRef.current = true;

    const id = ensureThread(userText || "Image Upload");
    const userMsg: Message = { role: "user", content: userText, attachment: image || undefined };
    const nextUserMsgs: Message[] = [...messages, userMsg];
    setMessages(nextUserMsgs);
    saveMessages(id!, nextUserMsgs);

    try {
      const currentTasks = readTasks();
      let data: SuggestResponse | null = null;

      if (selectedModel === "auto") {
        // Auto mode: Try models in sequence with timeout
        // Priority: Groq Llama 70B (High Quality) -> Gemini Flash (Fast/Reliable) -> Groq Llama 8B (Fastest)
        const autoModels = ["llama-3.3-70b-versatile", "gemini-2.5-flash", "llama-3.1-8b-instant"];
        let lastError = null;
        let success = false;

        for (const model of autoModels) {
          try {
            const controller = new AbortController();
            // 10s timeout to detect "slow" chat
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const r = await fetch("/api/ai/suggest", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ note: userText, image, messages: nextUserMsgs, model, tasks: currentTasks }),
              signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            data = await r.json();
            success = true;
            break;
          } catch (e) {
            lastError = e;
            console.warn(`Auto switch: ${model} failed`, e);
            continue;
          }
        }
        if (!success) throw lastError || new Error("All auto models failed");
      } else {
        const r = await fetch("/api/ai/suggest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ note: userText, image, messages: nextUserMsgs, model: selectedModel, tasks: currentTasks })
        });
        
        if (!r.ok) {
          let errorMsg = "Failed to get suggestion";
          try {
            const errorData = await r.json();
            errorMsg = errorData.error || errorData.message || "Failed to get suggestion";
          } catch (e) {
            // ignore json parse error
          }
          throw new Error(errorMsg);
        }
        
        data = await r.json();
      }
      let assistantText = data?.nextStep || "";
      let systemNote = "";
      
      if (data) {
        console.log("AI Response Data:", data);
        if (data.action === "add_task" && data.taskTitle) {
          addTaskLocal(data.taskTitle);
        } else if (data.action === "complete_task" && data.taskTitle) {
          completeTaskLocal(data.taskTitle);
        } else if (data.action === "delete_task" && data.taskTitle) {
          removeTaskLocal(data.taskTitle);
        } else if (data.action === "confirm_task" && data.taskTitle) {
          confirmTaskLocal(data.taskTitle);
        } else if (data.action === "add_crm_contact" && data.crmContact) {
          addCRMContact(data.crmContact);
        } else if (data.action === "update_crm_contact" && data.crmContact) {
          updateCRMContact(data.crmContact);
        } else if (data.action === "schedule_reminder" && data.taskTitle && data.reminderTime) {
          try {
            const time = new Date(data.reminderTime);
            if (isNaN(time.getTime())) throw new Error("Invalid time");
            const newReminder = { id: Date.now(), title: data.taskTitle, time: data.reminderTime, fired: false };
            const current = JSON.parse(localStorage.getItem("pp_reminders") || "[]");
            current.push(newReminder);
            localStorage.setItem("pp_reminders", JSON.stringify(current));
            setReminders(current);
            window.dispatchEvent(new Event("pp_reminders_update"));
            systemNote = `\n\n✓ System: Reminder set for ${time.toLocaleString()}`;
          } catch (e) {
            console.error("Failed to schedule reminder:", e);
            systemNote = `\n\n⚠ System: Failed to schedule reminder (Invalid time format from AI)`;
          }
        }
      }
      
      const finalMsgs: Message[] = [...nextUserMsgs, { role: "assistant", content: assistantText + systemNote, animate: true }];
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
      
      if (data?.urgent) {
        try {
          const reg = await navigator.serviceWorker.ready;
          await reg.showNotification("Immediate Action", {
            body: data?.nextStep || "",
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
    <div className={`w-full max-w-3xl mx-auto transition-all duration-300 ${centered ? 'scale-100 md:translate-y-2' : ''}`}>
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
               className={`transition-all duration-200 rounded-full border focus:outline-none ${
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
               className="transition-all duration-200 rounded-full border border-gray-300 text-black hover:border-gray-400 p-1.5 focus:outline-none"
               aria-label="Voice"
               title="Voice"
            >
               <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                 <path strokeLinecap="round" strokeLinejoin="round" d="M12 3a3 3 0 013 3v6a3 3 0 11-6 0V6a3 3 0 013-3zm7 9a7 7 0 01-14 0m7 7v3" />
               </svg>
            </button>
            <div className="relative">
              <button
                 type="button"
                 onClick={() => setShowModelSelector(!showModelSelector)}
                 className="flex items-center justify-center w-7 h-7 rounded-full border border-gray-300 text-black hover:border-gray-400 focus:outline-none bg-gray-50 hover:bg-gray-100 transition-colors"
                 title="Select AI Model"
              >
                 <span className="text-[9px] font-bold">AI</span>
              </button>
              {showModelSelector && (
                 <div className="absolute bottom-full right-0 mb-3 w-80 bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden z-[9999] animate-in fade-in slide-in-from-bottom-2 duration-200 origin-bottom-right">
                    <div className="max-h-80 overflow-y-auto p-1">
                       {AI_MODELS.map((model, idx) => (
                          <button
                            key={idx}
                            disabled={model.disabled}
                            onClick={() => {
                               if (model.disabled) return;
                               if (model.id) setSelectedModel(model.id);
                               setShowModelSelector(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors flex items-center justify-between ${
                               model.disabled 
                                 ? "text-gray-300 cursor-default" 
                                 : model.id === selectedModel
                                    ? "bg-gray-100 text-black font-medium"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-black"
                            }`}
                          >
                            <span>{model.name}</span>
                            {model.id === selectedModel && (
                              <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                       ))}
                    </div>
                 </div>
              )}
            </div>
         </div>
      </div>
    </div>
  );

  useEffect(() => {
    try {
      const clearedAt = localStorage.getItem("pp_tasks_cleared_at");
      if (!clearedAt) {
        localStorage.setItem(TASKS_KEY, JSON.stringify([]));
        localStorage.setItem("pp_tasks_cleared_at", String(Date.now()));
        window.dispatchEvent(new Event("storage"));
      }
    } catch {}
  }, []);

  return (
    <div className="flex flex-col h-full bg-white relative w-full">
         <div className="shrink-0 z-30 bg-white border-b border-gray-100 w-full">
           <div className="w-full px-4 py-2 flex items-center justify-between">
             <span className="text-xs font-semibold tracking-tight text-black">machine.io</span>
           </div>
         </div>

      {!threadId || messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center pl-0 pr-4 md:px-4 overflow-y-auto">
           <div className="w-full max-w-3xl mx-auto">
             <div className="w-full mb-1">
               <TopControlsWidget />
             </div>
             <InputArea centered={true} />
           </div>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto scroll-smooth">
            <div className="max-w-3xl mx-auto pl-0 pr-4 md:px-0 py-8 pb-4">
              <div className="flex flex-col space-y-8">
              {messages.map((m, i) => (
                  <ChatMessage key={i} role={m.role} content={m.content} animate={m.animate} />
              ))}
              {loading && (
                <div className="w-full py-8">
                  <div className="max-w-3xl mx-auto flex items-center gap-6 px-4 md:px-0">
                    <div className="rounded-full bg-gray-300 animate-pulse" style={{ width: "1cm", height: "1cm" }} />
                    <div className="flex items-center">
                      <span className="text-gray-400 text-sm">{loadingDots}</span>
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

          <div className="shrink-0 z-30 bg-white border-t border-gray-50 pt-4 pb-[calc(env(safe-area-inset-bottom)+12px)] md:pb-6 pl-0 pr-4 md:px-0 overflow-x-hidden">
             <div className="max-w-3xl mx-auto w-full">
               <div className="w-full mb-2">
                 <TopControlsWidget />
               </div>
               <InputArea />
               <p className="text-center text-xs text-gray-400 mt-2 pb-safe">
                  machine.io invites you to challenge it so we can go deeper.
               </p>
             </div>
          </div>
        </>
      )}
    </div>
  );
}
