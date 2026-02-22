"use client";

import { useState } from "react";
import { getSupabase, getCurrentUser } from "../lib/supabase";

interface DocumentSubmissionModalProps {
  onClose: () => void;
  onSubmitted: () => void;
  tier: number;
  type: "stakeholder"; // Can be expanded later
  title: string;
  placeholder?: string;
}

export default function DocumentSubmissionModal({ 
  onClose, 
  onSubmitted, 
  tier, 
  type,
  title,
  placeholder 
}: DocumentSubmissionModalProps) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    
    setLoading(true);
    const supabase = getSupabase();
    const user = await getCurrentUser();
    
    if (!user) throw new Error("Not authenticated");

    let finalContent = content;
    if (type === "stakeholder") {
      finalContent = `${content}\n\nSigned by: ${user.email}\nDate: ${new Date().toLocaleString()}`;
    }

    const { error } = await supabase.from("document_submissions").insert({
      user_id: user.id,
      tier,
      type,
      content: finalContent,
      status: "pending"
    });

    if (error) {
      console.error("Submission failed", error);
      alert(`Failed to submit document: ${error.message || JSON.stringify(error)}`);
      setLoading(false);
      return;
    }
    
    alert("Document submitted successfully! It is now under review.");
    onSubmitted();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-black">✕</button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800 mb-4">
            <p className="font-bold mb-1">Instructions:</p>
            <p>Please write your analysis below. This document will be reviewed by the administration before your tier can be completed.</p>
          </div>

          <textarea
            className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent resize-none"
            placeholder={placeholder || "Start writing your analysis here..."}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button 
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              onClick={handleSubmit}
              disabled={!content.trim() || loading}
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </>
              ) : "Submit for Review"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
