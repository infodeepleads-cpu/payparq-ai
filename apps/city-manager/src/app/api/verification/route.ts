import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

const ROLE_LABELS: Record<string, string> = {
  "0": "Korisnik",
  "1": "Vozač",
  "2": "Partner Parking Vlasnik",
  "3": "Ovlašteni zastupnik",
  "4": "Dostavljač",
  "5": "Referal",
  "6": "Agent",
  "10": "Administrator"
};

type AppUser = {
  id: string;
  email: string;
  email_confirmed_at?: string | null;
  user_metadata?: Record<string, any>;
  created_at?: string;
};

function resolvePrimaryRole(metadata: Record<string, any>) {
  const roles = Array.isArray(metadata?.roles) ? metadata.roles : [metadata?.original_role || metadata?.role];
  return String((roles || []).filter(Boolean)[0] || "0");
}

function buildClients() {
  const publicClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const adminClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  return { publicClient, adminClient };
}

async function getRequester(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return { error: NextResponse.json({ error: "Missing authorization header" }, { status: 401 }) };
  }
  const token = authHeader.replace("Bearer ", "");
  const { publicClient } = buildClients();
  const { data: { user }, error } = await publicClient.auth.getUser(token);
  if (error || !user) {
    return { error: NextResponse.json({ error: "Invalid session" }, { status: 401 }) };
  }
  return { user };
}

function canManageVerifications(user: any) {
  const metadata = user?.user_metadata || {};
  const roles = Array.isArray(metadata.roles) ? metadata.roles : [metadata.original_role || metadata.role];
  const isSuperAdmin = user?.email?.toLowerCase() === "payparq@outlook.com";
  const isRepresentative = (roles || []).includes("3");
  return { isSuperAdmin, isRepresentative, allowed: isSuperAdmin || isRepresentative };
}

async function listAllUsers(adminClient: any) {
  const users: AppUser[] = [];
  let page = 1;
  const perPage = 200;
  while (true) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage });
    if (error) {
      throw new Error(error.message);
    }
    const batch = (data?.users || []) as AppUser[];
    users.push(...batch);
    if (batch.length < perPage) {
      break;
    }
    page += 1;
  }
  return users;
}

export async function GET(req: NextRequest) {
  try {
    if (!env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }
    const requesterResult = await getRequester(req);
    if (requesterResult.error) {
      return requesterResult.error;
    }
    const requester = requesterResult.user;
    const access = canManageVerifications(requester);
    if (!access.allowed) {
      return NextResponse.json({ error: "Nedozvoljen pristup" }, { status: 403 });
    }

    const { adminClient } = buildClients();
    const users = await listAllUsers(adminClient);
    const requests = users
      .filter((u) => u.id !== requester.id)
      .filter((u) => !!u.email_confirmed_at)
      .filter((u) => {
        const metadata = u.user_metadata || {};
        return metadata.is_verified !== true;
      })
      .map((u, index) => {
        const metadata = u.user_metadata || {};
        const role = resolvePrimaryRole(metadata);
        const canApprove = access.isSuperAdmin || role !== "3";
        return {
          id: String(index + 1001),
          userId: u.id,
          fullName: metadata.full_name || metadata.name || "",
          email: u.email || "",
          phone: metadata.phone || metadata.phone_number || metadata.phoneNumber || metadata.mobile || "",
          role,
          roleLabel: ROLE_LABELS[role] || "Korisnik",
          createdAt: u.created_at || new Date().toISOString(),
          canApprove
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ requests });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Greška pri dohvaćanju zahtjeva" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }
    const requesterResult = await getRequester(req);
    if (requesterResult.error) {
      return requesterResult.error;
    }
    const requester = requesterResult.user;
    const access = canManageVerifications(requester);
    if (!access.allowed) {
      return NextResponse.json({ error: "Nedozvoljen pristup" }, { status: 403 });
    }

    const { targetUserId } = await req.json();
    if (!targetUserId) {
      return NextResponse.json({ error: "Nedostaje korisnik za odobravanje" }, { status: 400 });
    }

    const { adminClient } = buildClients();
    const { data: targetData, error: targetError } = await adminClient.auth.admin.getUserById(targetUserId);
    if (targetError || !targetData?.user) {
      return NextResponse.json({ error: targetError?.message || "Korisnik nije pronađen" }, { status: 404 });
    }

    const targetUser = targetData.user as AppUser;
    const targetMetadata = targetUser.user_metadata || {};
    const targetRole = resolvePrimaryRole(targetMetadata);
    if (!access.isSuperAdmin && targetRole === "3") {
      return NextResponse.json({ error: "Ovlaštenog zastupnika može odobriti samo payparq@outlook.com" }, { status: 403 });
    }

    const updatedMetadata = {
      ...targetMetadata,
      is_verified: true,
      verified_at: new Date().toISOString(),
      verified_by: requester.email || ""
    };

    const { error: updateError } = await adminClient.auth.admin.updateUserById(targetUserId, {
      user_metadata: updatedMetadata
    });
    if (updateError) {
      return NextResponse.json({ error: updateError.message || "Neuspjelo odobravanje" }, { status: 500 });
    }

    await adminClient.from("emails").insert({
      user_id: targetUserId,
      subject: "Verificiran",
      text_body: "Vaša verifikacija je odobrena. U roku 24 sata slijedi telefonski ili uživo kontakt te onboarding.",
      from_address: "PayParq"
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Greška pri odobravanju" }, { status: 500 });
  }
}
