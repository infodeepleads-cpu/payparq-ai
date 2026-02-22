"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "../../lib/supabase";

type Email = {
  id: string;
  created_at: string;
  from_address: string;
  subject: string;
  html_body: string;
  text_body: string;
  read: boolean;
};

export default function Inbox() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmails();
  }, []);

  const fetchEmails = async () => {
    setLoading(true);
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("emails")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setEmails(data);
    }
    setLoading(false);
  };

  const markAsRead = async (id: string) => {
    const supabase = getSupabase();
    const { error } = await supabase
      .from("emails")
      .update({ read: true })
      .eq("id", id);

    if (!error) {
      setEmails((prev) =>
        prev.map((email) =>
          email.id === id ? { ...email, read: true } : email
        )
      );
    }
  };

  return (
    <div className="h-screen bg-white">
      <div className="flex h-[calc(100vh-20px)] flex-col items-stretch overflow-y-auto w-full overflow-x-hidden">
        <div className="max-w-3xl w-full mx-auto mt-6 px-4 md:px-0 overflow-y-auto flex-1 flex flex-col">
          <div className="flex items-center border-b border-gray-100 pb-2 mb-6">
            <span className="text-xs font-semibold tracking-tight text-black mr-4 shrink-0">INBOX</span>
            <div className="flex items-center gap-4 flex-1">
            </div>
          </div>
          
          {loading ? (
            <div className="flex-1 flex justify-center items-center w-full min-h-[50vh] px-4">
              <div className="text-center text-gray-400 text-sm">Loading...</div>
            </div>
          ) : emails.length === 0 ? (
            <div className="flex-1 flex justify-center items-center w-full min-h-[50vh] px-4">
              <div className="text-center text-gray-400 text-sm">No emails yet.</div>
            </div>
          ) : (
            <div className="space-y-1 pb-10 pr-12 md:pr-0">
              {emails.map((email) => {
                const isExpanded = expandedId === email.id;
                return (
                  <div
                    key={email.id}
                    className="group border-b border-gray-100 py-3 hover:bg-gray-50 cursor-pointer transition-colors rounded-lg"
                    onClick={() => {
                      setExpandedId(isExpanded ? null : email.id);
                      if (!email.read && !isExpanded) {
                        markAsRead(email.id);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between mb-1 gap-4">
                      <span className={`text-xs break-words min-w-0 flex-1 whitespace-normal ${email.read ? "font-normal text-gray-600" : "font-bold text-black"}`}>
                        {email.subject}
                      </span>
                    </div>
                    <div className="">
                      <div className="flex flex-col gap-0.5 mb-1">
                        <p className="text-[10px] text-gray-500 break-all">
                          From: <span className="text-gray-800">{email.from_address}</span>
                        </p>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {new Date(email.created_at).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </span>
                      </div>
                      {!isExpanded && (
                        <div className="text-[10px] text-gray-500 break-all whitespace-normal w-full">
                          {email.text_body || "No preview available"}
                        </div>
                      )}
                      {isExpanded && (
                        <div className="mt-2 text-sm text-gray-800 bg-gray-50 p-4 rounded border border-gray-100">
                          <div className="flex flex-col sm:flex-row sm:justify-between text-xs text-gray-500 mb-4 border-b border-gray-200 pb-2 gap-1">
                            <span className="break-all">From: {email.from_address}</span>
                            <span className="shrink-0">{new Date(email.created_at).toLocaleString(undefined, {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit'
                            })}</span>
                          </div>
                          <div
                            className="prose prose-sm max-w-none text-sm"
                            dangerouslySetInnerHTML={{ __html: email.html_body || email.text_body || "<span class='text-gray-400 italic'>No content</span>" }}
                          />
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
