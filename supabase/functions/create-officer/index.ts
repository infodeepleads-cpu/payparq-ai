import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
};

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const userClient = createClient(supabaseUrl, anonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function json(data: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizeRole(raw: unknown): "super_admin" | "admin" | "manager" | "officer" {
  const role = String(raw ?? "")
    .trim()
    .toLowerCase()
    .replaceAll("-", "_")
    .replaceAll(" ", "_");
  if (role === "superadmin" || role.startsWith("super_admin")) return "super_admin";
  if (role.startsWith("admin")) return "admin";
  if (role.startsWith("manager")) return "manager";
  return "officer";
}

function randomPassword(length = 14): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#%";
  const arr = crypto.getRandomValues(new Uint32Array(length));
  let out = "";
  for (let i = 0; i < length; i++) {
    out += alphabet[arr[i] % alphabet.length];
  }
  return out;
}

function isEmail(value: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);
}

function canCreate(callerRole: string, targetRole: string): boolean {
  if (callerRole === "super_admin") return true;
  if (callerRole === "admin") return targetRole === "manager" || targetRole === "officer";
  if (callerRole === "manager") return targetRole === "officer";
  return false;
}

async function findUserIdByEmail(email: string): Promise<string | null> {
  let page = 1;
  const needle = email.toLowerCase();
  while (page <= 50) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) throw new Error(error.message);
    const users = data?.users ?? [];
    const match = users.find((u: any) => (u.email ?? "").toLowerCase() === needle);
    if (match?.id) return match.id;
    if (users.length < 200) break;
    page++;
  }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }
  if (!supabaseUrl || !serviceRoleKey || !anonKey) {
    return json({ error: "Missing server configuration" }, 500);
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!jwt) return json({ error: "Unauthorized" }, 401);

    const { data: callerUserData, error: callerUserError } = await userClient.auth.getUser(jwt);
    if (callerUserError || !callerUserData.user) {
      return json({ error: "Unauthorized" }, 401);
    }
    const callerUserId = callerUserData.user.id;

    const { data: callerProfile, error: callerProfileError } = await admin
      .from("profiles")
      .select("id,role")
      .eq("id", callerUserId)
      .maybeSingle();
    if (callerProfileError) return json({ error: callerProfileError.message }, 403);
    const callerRole = normalizeRole(callerProfile?.role);

    const body = await req.json();
    const email = String(body?.email ?? "").trim().toLowerCase();
    const name = String(body?.name ?? "").trim();
    const targetRole = normalizeRole(body?.role);
    const locationIdRaw = String(body?.location_id ?? "").trim();
    const requestedLocationIds = Array.isArray(body?.location_ids)
      ? body.location_ids
      : [];
    const locationIds = requestedLocationIds
      .map((id: unknown) => String(id ?? "").trim())
      .filter((id: string) => id.length > 0);
    const uniqueLocationIds = [...new Set(locationIds)];
    const locationId = locationIdRaw.length > 0
      ? locationIdRaw
      : (uniqueLocationIds.length > 0 ? uniqueLocationIds[0] : null);

    if (!isEmail(email)) return json({ error: "Invalid email" }, 400);
    if (!canCreate(callerRole, targetRole)) {
      return json({ error: "No permission to create this role" }, 403);
    }
    if ((targetRole === "manager" || targetRole === "officer") && !locationId) {
      return json({ error: "Location is required for manager/officer" }, 400);
    }

    let userId = await findUserIdByEmail(email);
    let generatedPassword: string | null = null;

    if (!userId) {
      generatedPassword = randomPassword();
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email,
        password: generatedPassword,
        email_confirm: true,
        user_metadata: {
          role: targetRole,
          name,
          location_id: locationId,
        },
      });
      if (createError || !created.user?.id) {
        return json({ error: createError?.message ?? "Failed to create auth user" }, 500);
      }
      userId = created.user.id;
    } else {
      const { error: updateUserError } = await admin.auth.admin.updateUserById(userId, {
        user_metadata: {
          role: targetRole,
          name,
          location_id: locationId,
        },
      });
      if (updateUserError) {
        return json({ error: updateUserError.message }, 500);
      }
    }

    const profilePayload: Record<string, unknown> = {
      id: userId,
      email,
      role: targetRole,
      full_name: name,
      updated_at: new Date().toISOString(),
    };
    if (locationId) profilePayload.location_id = locationId;
    if (generatedPassword) profilePayload.raw_password = generatedPassword;

    const { data: profileData, error: profileError } = await admin
      .from("profiles")
      .upsert(profilePayload, { onConflict: "id" })
      .select("*")
      .single();
    if (profileError) return json({ error: profileError.message }, 500);

    await admin.from("officer_assignments").delete().eq("officer_id", userId);

    if (targetRole === "manager" || targetRole === "officer") {
      const assignmentLocationIds = uniqueLocationIds.length > 0
        ? uniqueLocationIds
        : (locationId ? [locationId] : []);
      const assignmentRows = assignmentLocationIds.map((id) => ({
        officer_id: userId,
        location_id: id,
        assigned_by: callerUserId,
      }));
      if (assignmentRows.length > 0) {
        const { error: assignError } = await admin
          .from("officer_assignments")
          .insert(assignmentRows);
        if (assignError) return json({ error: assignError.message }, 500);
      }
    }

    return json({
      id: userId,
      user_id: userId,
      email,
      role: targetRole,
      raw_password: generatedPassword ?? profileData?.raw_password ?? null,
      user: { id: userId, email },
      profile: profileData,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return json({ error: message }, 500);
  }
});
