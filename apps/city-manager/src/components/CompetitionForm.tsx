"use client";

import { useState, useEffect, useCallback } from "react";
import { getSupabase, getCurrentUser } from "../lib/supabase";
import SignaturePad from "./SignaturePad";

interface Competitor {
  id: string;
  name: string;
  address: string;
  price: string;
  content: string;
  rating: string;
  note: string;
}

interface CompetitionFormProps {
  onClose: () => void;
  onSave: (data: any) => void;
  initialData?: any;
  tier: number;
}

export default function CompetitionForm({ onClose, onSave, initialData, tier }: CompetitionFormProps) {
  const [loading, setLoading] = useState(false);
  const [competitors, setCompetitors] = useState<Competitor[]>(initialData?.competitors || [
    { id: crypto.randomUUID(), name: "", address: "", price: "", content: "", rating: "", note: "" }
  ]);
  const [signature, setSignature] = useState(initialData?.signature || "");
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(initialData?.time || new Date().toLocaleTimeString('en-US', { hour12: false, hour: "2-digit", minute: "2-digit" }));

  const handleSignatureChange = useCallback((newSignature: string | null) => {
    setSignature(newSignature || "");
  }, []);

  const handleSend = async () => {
    try {
      setLoading(true);
      const user = await getCurrentUser();
      if (!user) {
        alert("You must be logged in to submit this document.");
        setLoading(false);
        return;
      }

      const supabase = getSupabase();
      
      const { error } = await supabase.from("document_submissions").insert({
        user_id: user.id,
        tier: tier,
        type: "competition",
        content: JSON.stringify({ competitors, signature, date, time }, null, 2),
        status: "pending"
      });

      if (error) {
        console.error("Submission failed", error);
        alert(`Failed to submit document: ${error.message || JSON.stringify(error)}`);
        setLoading(false);
        return;
      }

      alert("Competition analysis submitted successfully! It is now under review.");
      onSave({ competitors, signature, date, time });
      onClose();
      
    } catch (e: any) {
      console.error("Error submitting document:", e);
      alert(`An unexpected error occurred: ${e.message || e}`);
      setLoading(false);
    }
  };

  const addCompetitor = () => {
    setCompetitors([
      ...competitors,
      { id: crypto.randomUUID(), name: "", address: "", price: "", content: "", rating: "", note: "" }
    ]);
  };

  const removeCompetitor = (id: string) => {
    if (competitors.length > 1) {
      setCompetitors(competitors.filter(c => c.id !== id));
    }
  };

  const handleChange = (id: string, field: keyof Competitor, value: string) => {
    setCompetitors(competitors.map(c => 
      c.id === id ? { ...c, [field]: value } : c
    ));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex justify-between items-center z-20">
        <h2 className="text-lg font-bold text-black">COMPETITION ANALYSIS</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-black">✕</button>
      </div>
        
        <div className="p-6 space-y-8">
          {competitors.map((competitor, index) => (
            <div key={competitor.id} className="relative bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold uppercase">Competitor #{index + 1}</h3>
                {competitors.length > 1 && (
                  <button 
                    onClick={() => removeCompetitor(competitor.id)}
                    className="text-red-500 text-xs hover:text-red-700 font-medium"
                  >
                    REMOVE
                  </button>
                )}
              </div>
              
              <div className="space-y-4">
                {/* Naziv */}
                <div>
                  <label className="block text-xs font-bold uppercase mb-1">Naziv</label>
                  <input 
                    type="text" 
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck="false"
                    className="w-full border border-gray-300 rounded p-2 text-sm"
                    value={competitor.name}
                    onChange={(e) => handleChange(competitor.id, "name", e.target.value)}
                    placeholder="Enter competitor name"
                  />
                </div>

                {/* Adresa/lokacija */}
                <div>
                  <label className="block text-xs font-bold uppercase mb-1">Adresa / Lokacija</label>
                  <input 
                    type="text" 
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck="false"
                    className="w-full border border-gray-300 rounded p-2 text-sm"
                    value={competitor.address}
                    onChange={(e) => handleChange(competitor.id, "address", e.target.value)}
                    placeholder="Enter address or location"
                  />
                </div>

                {/* Cijena */}
                <div>
                  <label className="block text-xs font-bold uppercase mb-1">Cijena</label>
                  <input 
                    type="text" 
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck="false"
                    className="w-full border border-gray-300 rounded p-2 text-sm"
                    value={competitor.price}
                    onChange={(e) => handleChange(competitor.id, "price", e.target.value)}
                    placeholder="e.g. 2€/hour"
                  />
                </div>

                {/* Sadržaj */}
                <div>
                  <label className="block text-xs font-bold uppercase mb-1">Sadržaj</label>
                  <textarea 
                    className="w-full border border-gray-300 rounded p-2 text-sm h-20"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck="false"
                    value={competitor.content}
                    onChange={(e) => handleChange(competitor.id, "content", e.target.value)}
                    placeholder="Amenities, features, etc."
                  />
                </div>

                {/* Ocjena/recenzije */}
                <div>
                  <label className="block text-xs font-bold uppercase mb-1">Ocjena / Recenzije</label>
                  <input 
                    type="text" 
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck="false"
                    className="w-full border border-gray-300 rounded p-2 text-sm"
                    value={competitor.rating}
                    onChange={(e) => handleChange(competitor.id, "rating", e.target.value)}
                    placeholder="e.g. 4.5 stars (Google Maps)"
                  />
                </div>

                {/* Napomena */}
                <div>
                  <label className="block text-xs font-bold uppercase mb-1">Napomena</label>
                  <textarea 
                    className="w-full border border-gray-300 rounded p-2 text-sm h-24"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck="false"
                    value={competitor.note}
                    onChange={(e) => handleChange(competitor.id, "note", e.target.value)}
                    placeholder="Additional notes..."
                  />
                </div>
              </div>
            </div>
          ))}

          <button 
            onClick={addCompetitor}
            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 font-medium transition-colors flex items-center justify-center gap-2"
          >
            <span className="text-xl">+</span> ADD ANOTHER COMPETITOR
          </button>

          <div className="border-t pt-4">
            <h3 className="text-sm font-bold uppercase bg-gray-100 p-2 rounded text-black mb-4">
              VIII. ZAVRŠNA NAPOMENA
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-2">
              <div>
                <SignaturePad 
                  onChange={handleSignatureChange} 
                  initialSignature={signature} 
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase mb-1">Datum i Vrijeme</label>
                <div className="flex gap-2">
                  <input 
                    type="date" 
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck="false"
                    className="w-full border border-gray-300 rounded p-2 text-sm"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                  <input 
                    type="time" 
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck="false"
                    className="w-full border border-gray-300 rounded p-2 text-sm"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 flex justify-end gap-2 z-20">
          <button 
            onClick={handleSend}
            disabled={loading}
            className="px-6 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Sending..." : "Send to PayParq"}
          </button>
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-black"
          >
            Cancel
          </button>
          <button 
            onClick={() => onSave({ competitors, signature, date, time })}
            className="px-4 py-2 text-sm font-bold bg-black text-white rounded hover:bg-gray-800"
          >
            Save Analysis
          </button>
        </div>
      </div>
    </div>
  );
}
