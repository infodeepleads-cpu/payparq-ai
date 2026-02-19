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
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
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
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar List */}
      <div className="w-1/3 border-r bg-white overflow-y-auto">
        <div className="p-4 border-b flex justify-between items-center">
          <h1 className="text-xl font-semibold">Inbox</h1>
          <button onClick={fetchEmails} className="text-sm text-black hover:text-gray-600 transition-colors">Refresh</button>
        </div>
        {loading ? (
          <div className="p-4 text-gray-500">Loading...</div>
        ) : emails.length === 0 ? (
          <div className="p-4 text-gray-500">No emails yet.</div>
        ) : (
          <ul>
            {emails.map((email) => (
              <li
                key={email.id}
                onClick={() => setSelectedEmail(email)}
                className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                  selectedEmail?.id === email.id ? "bg-blue-50" : ""
                } ${!email.read ? "font-semibold" : ""}`}
              >
                <div className="flex justify-between text-sm text-gray-500 mb-1">
                  <span>{email.from_address}</span>
                  <span>{new Date(email.created_at).toLocaleDateString()}</span>
                </div>
                <div className="text-gray-900 truncate">{email.subject}</div>
                <div className="text-xs text-gray-500 truncate mt-1">
                  {email.text_body?.substring(0, 50)}...
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Email Content */}
      <div className="flex-1 overflow-y-auto p-8">
        {selectedEmail ? (
          <div>
            <div className="mb-6 pb-6 border-b">
              <h2 className="text-2xl font-bold mb-2">{selectedEmail.subject}</h2>
              <div className="text-sm text-gray-600">
                From: <span className="font-medium text-gray-900">{selectedEmail.from_address}</span>
              </div>
              <div className="text-sm text-gray-600">
                Date: {new Date(selectedEmail.created_at).toLocaleString()}
              </div>
            </div>
            <div 
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: selectedEmail.html_body || selectedEmail.text_body || "" }}
            />
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400">
            Select an email to read
          </div>
        )}
      </div>
    </div>
  );
}
