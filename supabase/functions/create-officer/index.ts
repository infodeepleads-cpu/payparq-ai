import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const bootstrapSecret = (Deno.env.get("BREAK_GLASS_BOOTSTRAP_SECRET") ?? "").trim();

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
};

const admin = createClient(supabaseUrl, serviceRoleKey, {
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

function roleFromMetadata(user: any): string {
  return normalizeRole(
    user?.user_metadata?.role ??
      user?.app_metadata?.role ??
      user?.user_metadata?.user_role ??
      user?.app_metadata?.user_role,
  );
}

async function ownsAllRequestedLocations(
  callerUserId: string,
  requestedLocationIds: string[],
): Promise<boolean> {
  if (requestedLocationIds.length === 0) return false;
  const locRows = await Promise.all(requestedLocationIds.map(async (rawId) => {
    const rowId = rawId.trim();
    if (!rowId) return null;
    const { data, error } = await admin
      .from("locations")
      .select("id,display_id,owner_id")
      .or(`id.eq.${rowId},display_id.eq.${rowId}`)
      .limit(1)
      .maybeSingle();
    if (error || !data) return null;
    return data;
  }));
  return locRows.every((row) => row && String(row.owner_id ?? "") === callerUserId);
}

async function hasPrivilegedProfile(): Promise<boolean> {
  const { count, error } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .in("role", ["super_admin", "admin", "manager"]);
  if (error) throw new Error(error.message);
  return Number(count ?? 0) > 0;
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
  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: "Missing server configuration" }, 500);
  }

  try {
    const body = await req.json();
    const action = String(body?.action ?? "").trim().toLowerCase();
    if (action === "bootstrap_super_admin") {
      if (!bootstrapSecret) {
        return json({ error: "Bootstrap secret not configured" }, 500);
      }
      const providedSecret = String(body?.secret ?? "").trim();
      if (!providedSecret || providedSecret !== bootstrapSecret) {
        return json({ error: "Unauthorized" }, 401);
      }
      const privilegedExists = await hasPrivilegedProfile();
      if (privilegedExists) {
        return json({ error: "Bootstrap is allowed only when no privileged profiles exist" }, 409);
      }
      const email = String(body?.email ?? "").trim().toLowerCase();
      const name = String(body?.name ?? "").trim();
      const password = String(body?.password ?? "");
      if (!isEmail(email)) return json({ error: "Invalid email" }, 400);
      if (password.trim().length < 8) {
        return json({ error: "Password must be at least 8 characters" }, 400);
      }
      let userId = await findUserIdByEmail(email);
      if (!userId) {
        const { data: created, error: createError } = await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            role: "super_admin",
            name,
          },
        });
        if (createError || !created.user?.id) {
          return json({ error: createError?.message ?? "Failed to create bootstrap user" }, 500);
        }
        userId = created.user.id;
      } else {
        const { error: updateUserError } = await admin.auth.admin.updateUserById(userId, {
          password,
          user_metadata: {
            role: "super_admin",
            name,
          },
        });
        if (updateUserError) return json({ error: updateUserError.message }, 500);
      }

      const { data: profileData, error: profileError } = await admin
        .from("profiles")
        .upsert({
          id: userId,
          email,
          role: "super_admin",
          full_name: name,
          updated_at: new Date().toISOString(),
        }, { onConflict: "id" })
        .select("*")
        .single();
      if (profileError) return json({ error: profileError.message }, 500);
      return json({
        ok: true,
        action: "bootstrap_super_admin",
        id: userId,
        email,
        role: "super_admin",
        profile: profileData,
      });
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!jwt) return json({ error: "Unauthorized" }, 401);

    const { data: callerUserData, error: callerUserError } = await admin.auth.getUser(jwt);
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
    const callerRole = normalizeRole(callerProfile?.role ?? roleFromMetadata(callerUserData.user));

    if (action === "delete_staff" || action === "delete") {
      const targetUserId = String(body?.userId ?? body?.user_id ?? body?.id ?? "").trim();
      if (!targetUserId) return json({ error: "Missing userId" }, 400);
      if (targetUserId === callerUserId) {
        return json({ error: "You cannot delete your own account" }, 400);
      }

      const { data: targetProfile, error: targetProfileError } = await admin
        .from("profiles")
        .select("id,role")
        .eq("id", targetUserId)
        .maybeSingle();
      if (targetProfileError) return json({ error: targetProfileError.message }, 500);
      const targetRole = normalizeRole(targetProfile?.role);
      if (!canCreate(callerRole, targetRole)) {
        return json({ error: "No permission to delete this role" }, 403);
      }

      const { error: assignmentDeleteError } = await admin
        .from("officer_assignments")
        .delete()
        .eq("officer_id", targetUserId);
      if (assignmentDeleteError) return json({ error: assignmentDeleteError.message }, 500);

      const { error: assignerDeleteError } = await admin
        .from("officer_assignments")
        .delete()
        .eq("assigned_by", targetUserId);
      if (assignerDeleteError) return json({ error: assignerDeleteError.message }, 500);

      const { error: locationsUpdateError } = await admin
        .from("locations")
        .update({ owner_id: callerUserId })
        .eq("owner_id", targetUserId);
      if (locationsUpdateError) return json({ error: locationsUpdateError.message }, 500);

      const { error: profileDeleteError } = await admin
        .from("profiles")
        .delete()
        .eq("id", targetUserId);
      if (profileDeleteError) return json({ error: profileDeleteError.message }, 500);

      const { error: authDeleteError } = await admin.auth.admin.deleteUser(targetUserId);
      if (authDeleteError && !authDeleteError.message.toLowerCase().includes("not found")) {
        return json({ error: authDeleteError.message }, 500);
      }

      return json({ ok: true, deleted_user_id: targetUserId });
    }

    const email = String(body?.email ?? "").trim().toLowerCase();
    const name = String(body?.name ?? "").trim();
    const targetRole = normalizeRole(body?.role);
    const locationIdRaw = String(body?.location_id ?? "").trim();
    const requestedLocationIds: string[] = Array.isArray(body?.location_ids)
      ? body.location_ids.map((id: unknown) => String(id ?? "").trim())
      : [];
    const locationIds = requestedLocationIds
      .filter((id: string) => id.length > 0);
    const uniqueLocationIds = [...new Set(locationIds)];
    const locationId = locationIdRaw.length > 0
      ? locationIdRaw
      : (uniqueLocationIds.length > 0 ? uniqueLocationIds[0] : null);
    const permissionLocationIds = locationId
      ? [...new Set([locationId, ...uniqueLocationIds])]
      : uniqueLocationIds;

    if (!isEmail(email)) return json({ error: "Invalid email" }, 400);
    let canCreateTargetRole = canCreate(callerRole, targetRole);
    const canUseOwnerFallback =
      !canCreateTargetRole &&
      targetRole === "manager" &&
      permissionLocationIds.length > 0;
    if (canUseOwnerFallback) {
      canCreateTargetRole = await ownsAllRequestedLocations(
        callerUserId,
        permissionLocationIds,
      );
    }
    if (!canCreateTargetRole) {
      return json({ error: "No permission to create this role" }, 403);
    }
    if (
      (targetRole === "admin" || targetRole === "manager" || targetRole === "officer") &&
      !locationId
    ) {
      return json({ error: "Location is required for admin/manager/officer" }, 400);
    }

    let primaryLocation: { id: string; display_id: string | null; name: string | null } | null =
      null;
    if (locationId) {
      const { data: locationData, error: locationError } = await admin
        .from("locations")
        .select("id, display_id, name")
        .eq("id", locationId)
        .maybeSingle();
      if (locationError) {
        return json({ error: locationError.message }, 500);
      }
      if (!locationData) {
        return json({ error: "Selected location not found" }, 400);
      }
      primaryLocation = {
        id: String(locationData.id),
        display_id: locationData.display_id ? String(locationData.display_id) : null,
        name: locationData.name ? String(locationData.name) : null,
      };
    }

    let userId = await findUserIdByEmail(email);
    const generatedPassword = randomPassword();

    if (!userId) {
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email,
        password: generatedPassword,
        email_confirm: true,
        user_metadata: {
          role: targetRole,
          name,
          location_id: locationId,
          location_display_id: primaryLocation?.display_id ?? null,
          location_name: primaryLocation?.name ?? null,
        },
      });
      if (createError || !created.user?.id) {
        return json({ error: createError?.message ?? "Failed to create auth user" }, 500);
      }
      userId = created.user.id;
    } else {
      const { error: updateUserError } = await admin.auth.admin.updateUserById(userId, {
        password: generatedPassword,
        user_metadata: {
          role: targetRole,
          name,
          location_id: locationId,
          location_display_id: primaryLocation?.display_id ?? null,
          location_name: primaryLocation?.name ?? null,
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
      raw_password: generatedPassword,
      updated_at: new Date().toISOString(),
    };
    if (locationId) profilePayload.location_id = locationId;
    if (primaryLocation?.display_id) {
      profilePayload.location_display_id = primaryLocation.display_id;
    }
    if (primaryLocation?.name) {
      profilePayload.location_name = primaryLocation.name;
    }

    const { data: profileData, error: profileError } = await admin
      .from("profiles")
      .upsert(profilePayload, { onConflict: "id" })
      .select("*")
      .single();
    if (profileError) return json({ error: profileError.message }, 500);

    await admin.from("officer_assignments").delete().eq("officer_id", userId);

    if (targetRole === "admin" || targetRole === "manager" || targetRole === "officer") {
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
      raw_password: generatedPassword,
      user: { id: userId, email },
      profile: profileData,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return json({ error: message }, 500);
  }
});
