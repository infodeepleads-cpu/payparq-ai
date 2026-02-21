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

  return (
    <div className="h-screen bg-white">
      <div className="flex h-[calc(100vh-20px)] flex-col items-center overflow-y-auto w-full">
        <div className="max-w-3xl w-full mx-auto px-4 md:px-0 py-0.5 flex items-center border-b border-gray-100 mt-4">
          <span className="text-xs font-semibold tracking-tight text-black mr-4 shrink-0">INBOX</span>
          <div className="flex items-center gap-4 flex-1">
          </div>
        </div>
        <div className="max-w-3xl w-full mx-auto mt-6 px-4 md:px-0 overflow-y-auto">
          {loading ? (
            <div className="text-center text-gray-400 text-sm py-10">Loading...</div>
          ) : emails.length === 0 ? (
            <div className="text-center text-gray-400 text-sm py-10">No emails yet.</div>
          ) : (
            <div className="space-y-1">
              {emails.map((email) => {
                const isExpanded = expandedId === email.id;
                return (
                  <div
                    key={email.id}
                    className="group border-b border-gray-100 py-3 hover:bg-gray-50 cursor-pointer transition-colors rounded-lg"
                    onClick={() => setExpandedId(isExpanded ? null : email.id)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-bold ${email.read ? "text-black" : "text-black"}`}>
                        {email.subject}
                      </span>
                      <span className="text-[10px] text-gray-400 uppercase tracking-wider">
                        {new Date(email.created_at).toLocaleString([], { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="">
                      <div className="flex justify-between items-baseline mb-1">
                        <p className="text-[10px] text-gray-500 truncate">
                          From: <span className="text-gray-800">{email.from_address}</span>
                        </p>
                      </div>
                      {!isExpanded && (
                        <div className="text-[10px] text-gray-500 truncate">
                          {email.text_body?.substring(0, 80) || "No preview available"}
                        </div>
                      )}
                      {isExpanded && (
                        <div className="mt-2 text-sm text-gray-800 bg-gray-50 p-2 rounded border border-gray-100">
                          <div
                            className="prose prose-sm max-w-none text-[12px]"
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
