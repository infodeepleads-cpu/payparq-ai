"use client";

import { useState } from "react";

interface Competitor {
  id: string;
  name: "";
  address: "";
  price: "";
  content: "";
  rating: "";
  note: "";
}

interface CompetitionFormProps {
  onClose: () => void;
  onSave: (data: any) => void;
  initialData?: any;
}

export default function CompetitionForm({ onClose, onSave, initialData }: CompetitionFormProps) {
  const [competitors, setCompetitors] = useState<Competitor[]>(initialData?.competitors || [
    { id: crypto.randomUUID(), name: "", address: "", price: "", content: "", rating: "", note: "" }
  ]);
  const [signature, setSignature] = useState(initialData?.signature || "");
  const [date, setDate] = useState(initialData?.date || "");

  const handleSend = () => {
    const subject = encodeURIComponent("Filled Competition Analysis");
    const body = encodeURIComponent(JSON.stringify({ competitors, signature, date }, null, 2));
    window.location.href = `mailto:payparq@outlook.com?subject=${subject}&body=${body}`;
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
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 flex justify-end gap-2 z-20">
          <button 
            onClick={handleSend}
            className="px-4 py-2 text-sm font-bold bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Send to PayParq
          </button>
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-black"
          >
            Cancel
          </button>
          <button 
            onClick={() => onSave({ competitors, signature, date })}
            className="px-4 py-2 text-sm font-bold bg-black text-white rounded hover:bg-gray-800"
          >
            Save Analysis
          </button>
        </div>
      </div>
    </div>
  );
}
