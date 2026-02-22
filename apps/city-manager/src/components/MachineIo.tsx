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

type Message = { role: "user" | "assistant" | "system"; content: string; attachment?: string; animate?: boolean };

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
  const CET_TZ = "Europe/Zagreb";
  const formatCET = (d: Date) =>
    d.toLocaleString("en-GB", {
      timeZone: CET_TZ,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });

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
  const readCRM = async () => {
    try {
      const supabase = getSupabase();
      const { data } = await supabase.from("crm_contacts").select("*").order("created_at", { ascending: false });
      return data || [];
    } catch {
      return [];
    }
  };
  
  const addCRMContact = async (contact: any) => {
    const supabase = getSupabase();
    // Convert to snake_case for DB
    const dbContact = {
      tier: contact.tier,
      decision_maker: contact.decisionMaker,
      location: contact.location,
      estimated_capacity: contact.estimatedCapacity,
      status: contact.status,
      next_step: contact.nextStep,
      notes: contact.notes
    };
    console.log("Inserting contact to DB:", dbContact);
    const { data, error } = await supabase.from("crm_contacts").insert(dbContact).select().single();
    console.log("DB result:", { data, error });
    if (!error && data) {
       // Fire event to update UI
       window.dispatchEvent(new Event("crm_storage"));
       localStorage.setItem("crm_update_signal", Date.now().toString());
       // Return in camelCase for UI
       return {
         ...data,
         decisionMaker: data.decision_maker,
         estimatedCapacity: data.estimated_capacity,
         nextStep: data.next_step
       };
    }
    return null;
  };

  const updateCRMContact = async (contact: any) => {
    const supabase = getSupabase();
    const { data: contacts } = await supabase.from("crm_contacts").select("*");
    if (!contacts) return null;
    
    // Try to find by ID first, then by decisionMaker
    let match = null;
    if (contact.id) {
      match = contacts.find((c: any) => c.id === contact.id);
    }
    
    // Check for numeric index (1-based from AI)
    if (!match && typeof contact.index === 'number') {
      // Sort by created_at desc to match UI list order
      const sorted = [...contacts].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      const i = contact.index - 1; 
      if (i >= 0 && i < sorted.length) {
        match = sorted[i];
      }
    }

    if (!match && contact.decisionMaker) {
      match = contacts.find((c: any) => c.decision_maker?.toLowerCase() === contact.decisionMaker.toLowerCase());
    }
    
    if (match) {
      const updates: any = {};
      if (contact.tier) updates.tier = contact.tier;
      if (contact.decisionMaker) updates.decision_maker = contact.decisionMaker;
      if (contact.location) updates.location = contact.location;
      if (contact.estimatedCapacity) updates.estimated_capacity = contact.estimatedCapacity;
      if (contact.status) updates.status = contact.status;
      if (contact.nextStep) updates.next_step = contact.nextStep;
      if (contact.notes) updates.notes = contact.notes;
      
      const { data } = await supabase.from("crm_contacts").update(updates).eq("id", match.id).select().single();
      if (data) {
        window.dispatchEvent(new Event("crm_storage"));
        localStorage.setItem("crm_update_signal", Date.now().toString());
        return {
           ...data,
           decisionMaker: data.decision_maker,
           estimatedCapacity: data.estimated_capacity,
           nextStep: data.next_step
        };
      }
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
      tasks[idx] = { ...tasks[idx], completed: true, completedAt: Date.now() };
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
  
  const deleteAllTasksLocal = () => {
    writeTasks([]);
    return true;
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
        console.log("=== AI RESPONSE DEBUG ===");
        console.log("Full AI response:", JSON.stringify(data, null, 2));
        console.log("Action:", data.action);
        console.log("TaskTitle:", data.taskTitle);
        console.log("ReminderTime:", data.reminderTime);
        console.log("Assistant text:", assistantText);
        console.log("========================");
        
        // Fallback: If AI mentions reminder but didn't use schedule_reminder action, try to fix it
        if ((assistantText.toLowerCase().includes("remind") || assistantText.toLowerCase().includes("reminder")) && 
            data.action !== "schedule_reminder" && 
            !data.action) {
          console.log("=== FALLBACK REMINDER DETECTION ===");
          console.log("AI mentioned reminder but no action set, attempting to parse...");
          
          // Try to extract reminder details from the text
          const reminderMatch = assistantText.match(/remind.*?(?:to|about)\s+(.+?)(?:\s+at\s+(.+?))?(?:\.|$)/i);
          if (reminderMatch) {
            const taskTitle = reminderMatch[1]?.trim() || "Reminder";
            let reminderTime = new Date().toISOString(); // Default to now
            
            // Try to parse relative time from text
             if (reminderMatch[2]) {
               const timeStr = reminderMatch[2].trim();
              console.log("Attempting to parse time:", timeStr);
               if (timeStr.toLowerCase().includes("hour")) {
                const hours = parseInt(timeStr.match(/(\d+)/)?.[1] || "1");
                 const future = new Date(Date.now() + hours * 60 * 60 * 1000);
                 future.setSeconds(0, 0);
                reminderTime = future.toISOString();
               } else {
                 const m = timeStr.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)|(\btomorrow\b)/i);
                 const now = new Date();
                 let year = now.getFullYear();
                 let month = now.getMonth() + 1;
                 let day = now.getDate();
                 let hr = now.getHours();
                 let min = now.getMinutes();
                 const hasTomorrow = /\btomorrow\b/i.test(timeStr);
                 if (hasTomorrow) {
                   const t = new Date(now);
                   t.setDate(t.getDate() + 1);
                   year = t.getFullYear();
                   month = t.getMonth() + 1;
                   day = t.getDate();
                 }
                 const hm = timeStr.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
                 if (hm) {
                   const h = parseInt(hm[1], 10);
                   min = hm[2] ? parseInt(hm[2], 10) : 0;
                   const ap = hm[3].toLowerCase();
                   hr = h % 12;
                   if (ap === "pm") hr += 12;
                 }
                 const utcEpoch = Date.UTC(year, month - 1, day, hr - 1, min, 0, 0);
                 let base = new Date(utcEpoch);
                 if (base.getTime() <= Date.now()) {
                   const nextDayEpoch = Date.UTC(year, month - 1, day + 1, hr - 1, min, 0, 0);
                   base = new Date(nextDayEpoch);
                 }
                 reminderTime = base.toISOString();
              }
            }
            
            console.log("Fallback reminder details:");
            console.log("TaskTitle:", taskTitle);
            console.log("ReminderTime:", reminderTime);
            
            // Override the AI's response with correct action
            data.action = "schedule_reminder";
            data.taskTitle = taskTitle;
            data.reminderTime = reminderTime;
            
            console.log("=== APPLIED FALLBACK FIX ===");
          }
        }
         
         // Fallback V2: If AI mentions reminder but used the WRONG action (e.g., add_task), force schedule_reminder
         if ((assistantText.toLowerCase().includes("remind") || assistantText.toLowerCase().includes("reminder")) && 
             data.action && data.action !== "schedule_reminder" &&
             data.action !== "update_crm_contact" &&
             data.action !== "add_crm_contact") {
           console.log("=== FALLBACK V2: WRONG ACTION FOR REMINDER ===");
           console.log("Assistant text:", assistantText);
           console.log("Received action:", data.action, " — overriding to schedule_reminder");
           // Try to get title from assistant text or user text
           let taskTitle = data.taskTitle || "";
           if (!taskTitle) {
             const m = assistantText.match(/remind.*?(?:to|about)\s+(.+?)(?:\s+at\s+(.+?))?(?:\.|$)/i);
             taskTitle = m?.[1]?.trim() || "Reminder";
           }
           // Compute a safe near-future time if we can't parse
           let reminderTime = data.reminderTime || "";
           if (!reminderTime) {
             const nowPlusTwo = new Date();
             nowPlusTwo.setMinutes(nowPlusTwo.getMinutes() + 2);
             reminderTime = nowPlusTwo.toISOString();
           }
           data.action = "schedule_reminder";
           data.taskTitle = taskTitle;
           data.reminderTime = reminderTime;
           console.log("Applied override:", { taskTitle, reminderTime });
         }
        
        if (data.action === "add_task" && data.taskTitle) {
          addTaskLocal(data.taskTitle);
        } else if (data.action === "delete_all_tasks") {
          deleteAllTasksLocal();
        } else if (data.action === "complete_task" && data.taskTitle) {
          completeTaskLocal(data.taskTitle);
        } else if (data.action === "delete_task" && data.taskTitle) {
          removeTaskLocal(data.taskTitle);
        } else if (data.action === "confirm_task" && data.taskTitle) {
          confirmTaskLocal(data.taskTitle);
        } else if (data.action === "add_crm_contact" && data.crmContact) {
          console.log("=== ADDING CRM CONTACT ===");
          console.log("Contact data:", data.crmContact);
          const saved = await addCRMContact(data.crmContact);
          console.log("Saved result:", saved);
          const name = saved?.decisionMaker || "Contact";
          const tierText = typeof saved?.tier !== "undefined" ? ` (Tier ${saved.tier})` : "";
          systemNote = `✓ System: CRM updated: ${name}${tierText}`;
        } else if (data.action === "update_crm_contact" && data.crmContact) {
          const updated = await updateCRMContact(data.crmContact);
          const name = updated?.decisionMaker || data.crmContact?.decisionMaker || "Contact";
          systemNote = `✓ System: CRM updated: ${name}`;
        } else if (data.action === "schedule_reminder" && data.taskTitle && data.reminderTime) {
          console.log("=== SCHEDULING REMINDER ===");
          console.log("TaskTitle:", data.taskTitle);
          console.log("ReminderTime:", data.reminderTime);
          try {
            const time = new Date(data.reminderTime);
            console.log("Parsed time:", time);
            console.log("Is valid time:", !isNaN(time.getTime()));
            if (isNaN(time.getTime())) throw new Error("Invalid time");
            const newReminder = { id: Date.now(), title: data.taskTitle, time: data.reminderTime, fired: false };
            const current = JSON.parse(localStorage.getItem("pp_reminders") || "[]");
            console.log("Current reminders before:", current);
            current.push(newReminder);
            localStorage.setItem("pp_reminders", JSON.stringify(current));
            console.log("Updated reminders:", current);
            setReminders(current);
            window.dispatchEvent(new Event("pp_reminders_update"));
            console.log("Reminder scheduled successfully!");
            systemNote = `✓ System: Reminder set for ${formatCET(time)} CET`;
            try {
              await fetch("/api/reminders/schedule", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: data.taskTitle, scheduled_at: time.toISOString() })
              });
            } catch {}
          } catch (e) {
            console.error("Failed to schedule reminder:", e);
            systemNote = `⚠ System: Failed to schedule reminder (Invalid time format from AI)`;
          }
          console.log("=== END SCHEDULING ===");
        } else if ((assistantText.includes("reminder") && (assistantText.includes("set") || assistantText.includes("scheduled"))) && data.action !== "schedule_reminder") {
           // Fallback warning if AI says it did it but used wrong action (or no action)
           console.log("=== REMINDER MISMATCH DETECTED ===");
           console.log("Assistant text mentions reminder:", assistantText);
           console.log("But action was:", data.action);
           console.log("Expected action: schedule_reminder");
           console.log("=================================");
           systemNote = `⚠ System: AI confirmed a reminder verbally but failed to schedule it (Action was: ${data.action || "None"}). Please try again.`;
        }
      }
      
      // Build final messages: assistant response + optional system confirmation as separate message
      const finalMsgs: Message[] = [...nextUserMsgs, { role: "assistant", content: assistantText, animate: true }];
      if (systemNote) {
        finalMsgs.push({ role: "system", content: systemNote.trim(), animate: true });
      }
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
    <div className={`relative w-full max-w-3xl mx-auto transition-all duration-300 ${centered ? 'scale-100 md:translate-y-2' : ''}`}>
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
      <div className="relative flex items-center w-full pl-3 pr-2 py-2 bg-white border border-gray-100 shadow-pill rounded-full focus-within:ring-0 focus-within:outline-none">
         <button
           onClick={() => fileInputRef.current?.click()}
           className="bg-transparent border-0 p-2 focus:outline-none text-gray-400 hover:text-gray-600 transition-colors"
           title="Upload image"
         >
           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
            className="flex-1 py-1.5 px-2 bg-transparent border-0 focus:ring-0 focus:outline-none text-base md:text-sm text-black placeholder:text-gray-500 font-normal leading-tight self-center min-w-0"
            autoFocus
            ref={inputRef}
          />
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative">
              {showModelSelector && (
                <div className="hidden md:block absolute bottom-full right-0 mb-2 w-64 bg-white/95 backdrop-blur-sm rounded-lg overflow-hidden z-[9999] animate-in slide-in-from-bottom-2 fade-in duration-200 origin-bottom-right">
                    <div className="max-h-60 overflow-y-auto p-2 space-y-1 thin-scrollbar">
                      {AI_MODELS.map((model, idx) => (
                        <button
                          key={idx}
                          disabled={model.disabled}
                          onClick={() => {
                            if (model.disabled) return;
                            if (model.id) setSelectedModel(model.id);
                            setShowModelSelector(false);
                          }}
                          className={`group flex items-center justify-between p-1.5 rounded transition-all w-full text-left border-none outline-none ring-0 shadow-none hover:shadow-none focus:shadow-none active:shadow-none ${
                            model.disabled 
                              ? "text-gray-300 cursor-default" 
                              : model.id === selectedModel
                                 ? "text-black font-medium"
                                 : "text-gray-500 hover:text-black"
                          }`}
                        >
                          <span className="text-xs truncate flex-1">{model.name}</span>
                          {model.id === selectedModel && (
                            <svg className="w-3 h-3 text-black shrink-0 ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
              )}
              {showModelSelector && (
                <div 
                  className="hidden md:block fixed inset-0 z-[9998] bg-transparent"
                  onClick={() => setShowModelSelector(false)}
                />
              )}
              <button
                  type="button"
                  onClick={() => setShowModelSelector(!showModelSelector)}
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 border-0 text-gray-600 hover:text-black hover:bg-gray-200 focus:outline-none transition-colors group shadow-none ring-0"
                  title="Select AI Model"
               >
                  <span className="text-sm font-normal leading-none">AI</span>
               </button>
             </div>
             <button
                type="button"
                disabled={loading}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 border-0 text-gray-600 hover:text-black hover:bg-gray-200 focus:outline-none transition-colors shadow-none ring-0"
                aria-label="Voice"
                title="Voice"
             >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
             </button>
            <button
               onClick={sendMessage}
               disabled={(!input.trim() && !selectedImage) || loading}
               className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 focus:outline-none shadow-sm ${
                 input.trim() || selectedImage
                   ? "bg-zinc-900 text-white hover:bg-zinc-800" 
                   : "bg-gray-100 text-gray-400 cursor-not-allowed"
               }`}
               aria-label="Send"
               title="Send"
               data-role="cta"
            >
               <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                 <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
               </svg>
            </button>
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
    <div className="flex flex-col h-full bg-white relative w-full overscroll-none md:overscroll-auto touch-pan-y md:touch-auto">
         {/* Mobile AI Dropdown - Rendered at root level to avoid clipping */}
         {showModelSelector && (
            <>
              <div 
                className="fixed inset-0 z-[9998] bg-black/40 md:hidden backdrop-blur-sm"
                onClick={() => setShowModelSelector(false)}
              />
              <div className="fixed bottom-0 left-0 right-0 md:hidden bg-white rounded-t-3xl z-[9999] animate-in slide-in-from-bottom-full duration-300 h-[60vh] flex flex-col pt-6">
                 <div className="flex-1 overflow-y-auto px-6 space-y-2 thin-scrollbar pb-safe">
                   {AI_MODELS.map((model, idx) => (
                     <button
                       key={idx}
                       disabled={model.disabled}
                       onClick={() => {
                         if (model.disabled) return;
                         if (model.id) setSelectedModel(model.id);
                         setShowModelSelector(false);
                       }}
                       className={`group flex items-center justify-between py-2 w-full text-left bg-transparent active:bg-transparent focus:bg-transparent hover:bg-transparent outline-none border-none ring-0 shadow-none hover:shadow-none focus:shadow-none active:shadow-none ${
                          model.disabled 
                            ? "text-gray-300 cursor-default" 
                            : model.id === selectedModel
                              ? "text-black font-medium"
                              : "text-gray-600"
                        }`}
                       style={{ WebkitTapHighlightColor: 'transparent' }}
                     >
                       <span className="text-sm leading-7 truncate flex-1">{model.name}</span>
                       {model.id === selectedModel && (
                          <svg className="w-4 h-4 text-black shrink-0 ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                       )}
                     </button>
                   ))}
                 </div>
               </div>
            </>
         )}

         <div className="shrink-0 z-30 bg-white border-b border-gray-100 w-full hidden md:block">
           <div className="w-full px-4 py-2 flex items-center justify-between">
             <span className="text-xs font-semibold tracking-tight text-black">machine.io</span>
           </div>
         </div>

      {!threadId || messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center pl-0 pr-4 md:px-4 overflow-y-auto">
           <div className="w-full max-w-3xl mx-auto">
             <div className="w-full mb-1 block">
               <TopControlsWidget />
             </div>
             <InputArea centered={true} />
           </div>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto scroll-smooth touch-auto">
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

          <div className="shrink-0 z-30 bg-white border-t border-gray-50 pt-4 pb-4 md:pb-6 pl-1 pr-4 md:px-0 touch-auto min-h-[80px]">
             <div className="max-w-3xl mx-auto w-full">
               <div className="w-full mb-2 block">
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
