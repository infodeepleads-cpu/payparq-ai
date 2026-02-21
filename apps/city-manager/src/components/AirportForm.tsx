"use client";

import { useState } from "react";

interface AirportFormProps {
  onClose: () => void;
  onSave: (data: any) => void;
  initialData?: any;
}

export default function AirportForm({ onClose, onSave, initialData }: AirportFormProps) {
  const [formData, setFormData] = useState(initialData || {
    airportName: "",
    contactPerson: "",
    attitude: "", // Pozitivan, Neutralan, Negativan, Nejasan
    restrictions: [], // Array of strings
    restrictionDetails: "",
    pressures: "", // NE, DA
    pressureTypes: [], // Array of strings
    pressureOther: "",
    commentary: "",
    final_signature: "",
    final_date: ""
  });

  const handleSend = () => {
    const subject = encodeURIComponent("Filled Airport Analysis");
    const body = encodeURIComponent(JSON.stringify(formData, null, 2));
    window.location.href = `mailto:payparq@outlook.com?subject=${subject}&body=${body}`;
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field: string, item: string) => {
    setFormData((prev: any) => {
      const current = prev[field] || [];
      if (current.includes(item)) {
        return { ...prev, [field]: current.filter((i: string) => i !== item) };
      } else {
        return { ...prev, [field]: [...current, item] };
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex justify-between items-center z-20">
        <h2 className="text-lg font-bold text-black">AIRPORT SHUTTLE</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-black">✕</button>
      </div>
        
        <div className="p-6 space-y-6">
          {/* Header Info */}
          <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Naziv aerodroma</label>
              <input 
                type="text" 
                className="w-full border border-gray-300 rounded p-2 text-sm"
                value={formData.airportName}
                onChange={(e) => handleChange("airportName", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Kontaktirana osoba / odjel</label>
              <input 
                type="text" 
                className="w-full border border-gray-300 rounded p-2 text-sm"
                value={formData.contactPerson}
                onChange={(e) => handleChange("contactPerson", e.target.value)}
              />
            </div>
          </div>

          {/* 6. Opći stav aerodroma */}
          <div className="border-t pt-4">
            <label className="block text-sm font-bold mb-2">6. Opći stav aerodroma</label>
            <p className="text-xs text-gray-600 mb-2">Stav aerodroma prema privatnim parkiralištima u okolici:</p>
            <div className="flex flex-wrap gap-4 mb-2">
              {["Pozitivan", "Neutralan", "Negativan", "Nejasan"].map(opt => (
                <label key={opt} className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="attitude"
                    checked={formData.attitude === opt}
                    onChange={() => handleChange("attitude", opt)}
                  />
                  <span className="text-sm">{opt}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 7. Ograničenja */}
          <div className="border-t pt-4">
            <label className="block text-sm font-bold mb-2">7. Ograničenja</label>
            <p className="text-xs text-gray-600 mb-2">Postoje li ograničenja vezana uz:</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
              {["Cijene", "Oglašavanje", "Znakove", "Transfer putnika", "Komunikaciju s korisnicima"].map(item => (
                <label key={item} className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    checked={formData.restrictions.includes(item)}
                    onChange={() => toggleArrayItem("restrictions", item)}
                  />
                  <span className="text-sm">{item}</span>
                </label>
              ))}
            </div>
            <textarea 
              placeholder="Detalji..."
              className="w-full border border-gray-300 rounded p-2 text-sm h-20"
              value={formData.restrictionDetails}
              onChange={(e) => handleChange("restrictionDetails", e.target.value)}
            />
          </div>

          {/* 8. Pritisci ili rizici */}
          <div className="border-t pt-4">
            <label className="block text-sm font-bold mb-2">8. Pritisci ili rizici</label>
            <p className="text-xs text-gray-600 mb-2">Postoje li formalni ili neformalni pritisci na privatne parkinge?</p>
            <div className="flex gap-4 mb-3">
              {["NE", "DA"].map(opt => (
                <label key={opt} className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="pressures"
                    checked={formData.pressures === opt}
                    onChange={() => handleChange("pressures", opt)}
                  />
                  <span className="text-sm">{opt}</span>
                </label>
              ))}
            </div>
            
            {formData.pressures === "DA" && (
              <div className="pl-4 bg-gray-50 p-3 rounded space-y-3">
                <p className="text-xs font-bold">Vrsta pritiska:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {["Inspekcijski nadzori", "Pravne prijetnje", "Ugovorna ograničenja"].map(type => (
                    <label key={type} className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        checked={formData.pressureTypes.includes(type)}
                        onChange={() => toggleArrayItem("pressureTypes", type)}
                      />
                      <span className="text-sm">{type}</span>
                    </label>
                  ))}
                </div>
                <input 
                  type="text" 
                  placeholder="Drugo..."
                  className="w-full border border-gray-300 rounded p-2 text-sm mt-2"
                  value={formData.pressureOther}
                  onChange={(e) => handleChange("pressureOther", e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Napomena – aerodrom */}
          <div className="border-t pt-4">
            <label className="block text-sm font-bold mb-2">Napomena – aerodrom</label>
            <textarea 
              className="w-full border border-gray-300 rounded p-2 text-sm h-32"
              placeholder="Unesite dodatne napomene..."
              value={formData.commentary}
              onChange={(e) => handleChange("commentary", e.target.value)}
            />
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-bold uppercase bg-gray-100 p-2 rounded text-black mb-4">
              VIII. ZAVRŠNA NAPOMENA
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-2">
              <div>
                <label className="block text-xs font-bold uppercase mb-1">Potpis City Managera</label>
                <input 
                  type="text" 
                  className="w-full border border-gray-300 rounded p-2 text-sm"
                  value={formData.final_signature}
                  onChange={(e) => handleChange("final_signature", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase mb-1">Datum</label>
                <input 
                  type="date" 
                  className="w-full border border-gray-300 rounded p-2 text-sm"
                  value={formData.final_date}
                  onChange={(e) => handleChange("final_date", e.target.value)}
                />
              </div>
            </div>
          </div>

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
            onClick={() => onSave(formData)}
            className="px-4 py-2 text-sm font-bold bg-black text-white rounded hover:bg-gray-800"
          >
            Save Document
          </button>
        </div>
      </div>
    </div>
  );
}
