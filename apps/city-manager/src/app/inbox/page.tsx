"use client";

import { useEffect, useState } from "react";
import { getSupabase, getCurrentUser, isSuperAdmin } from "../../lib/supabase";

type InboxItem = {
  id: string;
  type: "email" | "submission";
  created_at: string;
  from: string;
  subject: string;
  body: string;
  read: boolean;
  status?: string; // for submissions
  tier?: number; // for submissions
  submissionId?: string; // for submissions
};

export default function Inbox() {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdmin();
    fetchInbox();

    const supabase = getSupabase();
    const channel = supabase
      .channel('inbox_updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'document_submissions' },
        (payload) => {
          fetchInbox();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'emails' },
        (payload) => {
          fetchInbox();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const checkAdmin = async () => {
    const admin = await isSuperAdmin();
    setIsAdmin(admin);
  };

  const fetchInbox = async () => {
    setLoading(true);
    const supabase = getSupabase();
    const user = await getCurrentUser();
    
    if (!user) {
      setLoading(false);
      return;
    }

    const admin = await isSuperAdmin();
    const allItems: InboxItem[] = [];

    // 1. Fetch Emails
    let emailQuery = supabase.from("emails").select("*").order("created_at", { ascending: false });
    
    if (!admin) {
      emailQuery = emailQuery.eq("user_id", user.id);
    }
    
    const { data: emails } = await emailQuery;

    if (emails) {
      const emailItems: InboxItem[] = emails.map((e: any) => ({
        id: e.id,
        type: "email" as const,
        created_at: e.created_at,
        from: e.from_address,
        subject: e.subject,
        body: e.html_body || e.text_body,
        read: e.read
      }));
      allItems.push(...emailItems);
    }

    // 2. Fetch Document Submissions (Only for Admin)
    if (admin) {
      const { data: submissions } = await supabase
        .from("document_submissions")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
        
      if (submissions) {
        const submissionItems: InboxItem[] = submissions.map((s: any) => ({
          id: s.id,
          type: "submission" as const,
          created_at: s.created_at,
          from: s.user_id ? `User ${s.user_id.substring(0, 8)}...` : "Unknown User",
          subject: `[REVIEW] Document Submission: Tier ${s.tier} (${s.type})`,
          body: s.content,
          read: false,
          status: s.status,
          tier: s.tier,
          submissionId: s.id
        }));
        allItems.push(...submissionItems);
      }
    }

    // Sort by date desc
    allItems.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    setItems(allItems);
    setLoading(false);
  };

  const markAsRead = async (id: string, type: "email" | "submission") => {
    if (type === "submission") return; // Submissions don't have read status in this simplified view
    
    const supabase = getSupabase();
    await supabase.from("emails").update({ read: true }).eq("id", id);
    
    setItems(prev => prev.map(i => i.id === id ? { ...i, read: true } : i));
  };
  
  const approveSubmission = async (item: InboxItem) => {
    if (item.type !== "submission" || !item.submissionId) return;
    
    if (!confirm(`Are you sure you want to approve this Tier ${item.tier} submission?`)) return;

    try {
      const supabase = getSupabase();
      
      // 1. Update submission status
      const { error: subError } = await supabase
        .from("document_submissions")
        .update({ status: "approved" })
        .eq("id", item.submissionId);

      if (subError) throw subError;

      // 2. Fetch user's progress to check for auto-advance
      // We need the user_id of the submission owner
      const { data: submission } = await supabase
        .from("document_submissions")
        .select("user_id, tier")
        .eq("id", item.submissionId)
        .single();
        
      if (submission) {
        const userId = submission.user_id;
        const tier = submission.tier;
        
        // Check if ALL required documents are approved
        const requiredTypes = ["permits", "competition", "lot_activation", "hub_activation"];
        if (tier === 1) requiredTypes.push("airport");
        if (tier === 6 || tier === 7) requiredTypes.push("stakeholder");

        // Fetch all approved submissions for this tier
        const { data: approvedSubs } = await supabase
          .from("document_submissions")
          .select("type, status")
          .eq("user_id", userId)
          .eq("tier", tier)
          .eq("status", "approved");
          
        const approvedTypes = new Set(approvedSubs?.map(s => s.type) || []);
        const allApproved = requiredTypes.every(t => approvedTypes.has(t));
        
        if (allApproved) {
           // Advance User Tier
           const { data: fullProgress } = await supabase.from("user_progress").select("*").eq("user_id", userId).single();
           if (fullProgress && fullProgress.current_tier === tier) {
              const tiersCompleted = fullProgress.tiers_completed || {};
              // Ensure the tier object exists
               if (!tiersCompleted[tier]) {
                 tiersCompleted[tier] = { completed: true, documentStatus: "approved" };
               } else {
                 tiersCompleted[tier].completed = true;
                 tiersCompleted[tier].documentStatus = "approved";
               }
              
              await supabase.from("user_progress").update({
                 current_tier: tier + 1,
                 tiers_completed: tiersCompleted
              }).eq("user_id", userId);
           }
           alert("Submission approved. User has completed all requirements for Tier " + tier + " and has been advanced to Tier " + (tier + 1) + ".");
        } else {
           const missing = requiredTypes.filter(t => !approvedTypes.has(t));
           alert(`Submission approved. User still needs to complete: ${missing.join(", ")} to advance.`);
        }
      }

      alert("Submission approved and user progressed.");
      fetchInbox(); // Refresh
      
    } catch (e) {
      console.error("Approval failed", e);
      alert("Failed to approve submission.");
    }
  };

  return (
    <div className="h-screen bg-white overflow-x-hidden">
      <div className="flex h-[calc(100vh-20px)] flex-col items-stretch overflow-y-auto w-full overflow-x-hidden">
        <div className="max-w-3xl w-full mx-auto mt-6 px-1 md:px-0 overflow-y-auto flex-1 flex flex-col">
          <div className="flex items-center border-b border-gray-100 pb-2 mb-6">
            <span className="text-xs font-semibold tracking-tight text-black mr-4 shrink-0">INBOX {isAdmin && "(Admin Mode)"}</span>
          </div>
          
          {loading ? (
            <div className="flex-1 flex justify-center items-center w-full min-h-[50vh] px-4">
              <div className="text-center text-gray-400 text-sm">Loading...</div>
            </div>
          ) : items.length === 0 ? (
            <div className="flex-1 flex justify-center items-center w-full min-h-[50vh] px-4">
              <div className="text-center text-gray-400 text-sm">No items.</div>
            </div>
          ) : (
            <div className="space-y-1 pb-10 overflow-x-hidden">
              {items.map((item) => {
                const isExpanded = expandedId === item.id;
                const isSubmission = item.type === "submission";
                
                return (
                  <div
                    key={item.id}
                    className={`group border-b border-gray-100 py-3 hover:bg-gray-50 cursor-pointer transition-colors rounded-lg ${isSubmission ? "bg-blue-50/30" : ""}`}
                    onClick={() => {
                      setExpandedId(isExpanded ? null : item.id);
                      if (!item.read && !isExpanded && !isSubmission) {
                        markAsRead(item.id, "email");
                      }
                    }}
                  >
                    <div className="flex items-center justify-between mb-1 gap-4">
                      <span className={`text-xs break-words min-w-0 flex-1 whitespace-normal ${item.read ? "font-normal text-gray-600" : "font-bold text-black"}`}>
                        {isSubmission ? `[REVIEW] ${item.subject}` : item.subject}
                      </span>
                      {isSubmission && (
                        <span className="text-[10px] bg-black text-white px-2 py-0.5 rounded-full shrink-0">
                          Action Required
                        </span>
                      )}
                    </div>
                    <div className="">
                      <div className="flex flex-col gap-0.5 mb-1">
                        <p className="text-[10px] text-gray-500 break-all">
                          From: <span className="text-gray-800">{item.from}</span>
                        </p>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {new Date(item.created_at).toLocaleString(undefined, {
                            month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
                          })}
                        </span>
                      </div>
                      
                      {isExpanded && (
                        <div className="mt-2 text-sm text-gray-800 bg-gray-50 p-4 rounded border border-gray-100">
                           <div className="mb-4 whitespace-pre-wrap text-xs">{item.body}</div>
                           
                           {isSubmission && isAdmin && (
                             <div className="flex justify-end pt-4 border-t border-gray-200">
                               <button
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   approveSubmission(item);
                                 }}
                                 className="bg-black text-white px-4 py-2 text-xs rounded-lg hover:bg-gray-800 font-bold"
                               >
                                 Review & Grade
                               </button>
                             </div>
                           )}
                           
                           {!isSubmission && (
                             <div
                               className="prose prose-sm max-w-none text-sm break-words whitespace-normal overflow-x-hidden"
                               dangerouslySetInnerHTML={{ __html: item.body }}
                             />
                           )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
