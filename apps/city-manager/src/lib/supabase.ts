import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { env } from "./env";

let supabaseInstance: SupabaseClient | null = null;
let tasksMirrorTimer: ReturnType<typeof setTimeout> | null = null;
let queuedTasksSnapshot: any[] = [];
const TASKS_KEY = "pp_tasks";

export function getSupabase() {
  if (supabaseInstance) return supabaseInstance;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing Supabase environment variables. Please check your .env.local file and ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set."
    );
  }

  supabaseInstance = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== "undefined" ? window.localStorage : undefined
    }
  });
  return supabaseInstance;
}

export async function getCurrentUser() {
  const supabase = getSupabase();
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) return null;
  return session.user;
}

export async function isSuperAdmin() {
  const user = await getCurrentUser();
  return user?.email === "payparq@outlook.com";
}

const toTaskVersion = (task: any) => {
  const createdAt = Number(task?.createdAt || 0);
  const completedAt = Number(task?.completedAt || 0);
  return Math.max(createdAt, completedAt, 0);
};

const normalizeTask = (task: any, fallbackIndex: number) => {
  const id = String(task?.id || `task-${fallbackIndex}-${Date.now()}`);
  const title = String(task?.title || "").trim();
  if (!title) return null;
  const createdAt = Number(task?.createdAt || Date.now());
  const completed = !!task?.completed;
  const completedAt = completed ? Number(task?.completedAt || Date.now()) : undefined;
  return {
    id,
    title,
    completed,
    confirmed: !!task?.confirmed,
    createdAt,
    completedAt
  };
};

const mergeTaskSets = (localTasks: any[], remoteTasks: any[]) => {
  const byId = new Map<string, any>();
  [...localTasks, ...remoteTasks].forEach((task, index) => {
    const normalized = normalizeTask(task, index);
    if (!normalized) return;
    const existing = byId.get(normalized.id);
    if (!existing || toTaskVersion(normalized) >= toTaskVersion(existing)) {
      byId.set(normalized.id, normalized);
    }
  });
  return Array.from(byId.values()).sort((a, b) => toTaskVersion(b) - toTaskVersion(a));
};

async function mirrorTasksNow(tasks: any[]) {
  if (typeof window === "undefined") return;
  try {
    const user = await getCurrentUser();
    if (!user) return;
    const supabase = getSupabase();
    const normalized = tasks
      .map((task, index) => normalizeTask(task, index))
      .filter(Boolean) as any[];

    const { error: deleteError } = await supabase
      .from("tasks")
      .delete()
      .eq("type", "local_task")
      .eq("lead_id", user.id);

    if (deleteError) {
      console.warn("Failed to clear mirrored tasks", deleteError.message);
      return;
    }

    if (normalized.length === 0) return;

    const dueAt = new Date().toISOString().slice(0, 10);
    const payload = normalized.map((task) => ({
      type: "local_task",
      lead_id: user.id,
      due_at: dueAt,
      status: task.completed ? (task.confirmed ? "confirmed" : "completed") : "pending",
      payload: JSON.stringify({
        ...task,
        userId: user.id,
        mirroredAt: Date.now()
      })
    }));

    const { error: insertError } = await supabase.from("tasks").insert(payload);
    if (insertError) {
      console.warn("Failed to mirror tasks", insertError.message);
    }
  } catch (error) {
    console.warn("Task mirror error", error);
  }
}

export function queueTasksMirror(tasks: any[]) {
  if (typeof window === "undefined") return;
  queuedTasksSnapshot = Array.isArray(tasks) ? tasks : [];
  if (tasksMirrorTimer) {
    clearTimeout(tasksMirrorTimer);
  }
  tasksMirrorTimer = setTimeout(() => {
    const snapshot = queuedTasksSnapshot;
    queuedTasksSnapshot = [];
    tasksMirrorTimer = null;
    void mirrorTasksNow(snapshot);
  }, 350);
}

export async function pullMirroredTasksToLocal() {
  if (typeof window === "undefined") return false;
  try {
    const user = await getCurrentUser();
    if (!user) return false;
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("tasks")
      .select("status,payload")
      .eq("type", "local_task")
      .eq("lead_id", user.id);

    if (error || !Array.isArray(data) || data.length === 0) return false;

    const remoteTasks = data
      .map((row: any, index: number) => {
        const parsedPayload =
          typeof row?.payload === "string"
            ? JSON.parse(row.payload)
            : row?.payload;
        const normalized = normalizeTask(parsedPayload, index);
        if (!normalized) return null;
        if (!normalized.completed && (row?.status === "completed" || row?.status === "confirmed")) {
          normalized.completed = true;
        }
        if (!normalized.confirmed && row?.status === "confirmed") {
          normalized.confirmed = true;
        }
        return normalized;
      })
      .filter(Boolean) as any[];

    if (remoteTasks.length === 0) return false;

    const rawLocal = localStorage.getItem(TASKS_KEY);
    const localTasks = rawLocal ? JSON.parse(rawLocal) : [];
    const merged = mergeTaskSets(localTasks, remoteTasks);
    const before = JSON.stringify(localTasks);
    const after = JSON.stringify(merged);
    if (before !== after) {
      localStorage.setItem(TASKS_KEY, after);
      window.dispatchEvent(new Event("storage"));
      return true;
    }
    return false;
  } catch (error) {
    console.warn("Task hydrate error", error);
    return false;
  }
}
