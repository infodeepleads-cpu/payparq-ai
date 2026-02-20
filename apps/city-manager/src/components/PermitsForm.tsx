"use client";

import { useState } from "react";

interface PermitsFormProps {
  onClose: () => void;
  onSave: (data: any) => void;
  initialData?: any;
}

export default function PermitsForm({ onClose, onSave, initialData }: PermitsFormProps) {
  const [formData, setFormData] = useState(initialData || {
    city: "",
    address: "",
    date: "",
    manager: "",
    institution: "",
    contactPerson: "",
    contactInfo: "",
    permitStatus: "", // DA, NE, UVJETNO
    permitConditions: "",
    additionalPermits: [], // Array of strings
    otherPermit: "",
    specialZone: false,
    specialZoneDetails: "",
    signType: "", // Pomični, Stalni, Oboje
    signDistance: "",
    qrCode: "", // Dozvoljen, Nije dozvoljen, Nije jasno
    campersAllowed: "", // DA, NE
    camperZoneType: "", // U istoj zoni, Isključivo u posebnoj
    camperConditions: [], // Array of strings
    camperOther: "",
    commentary: ""
  });

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
          <h2 className="text-lg font-bold text-black">PERMITS & LICENSES</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-black">✕</button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Header Info */}
          <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Grad i Lokacija</label>
              <input 
                type="text" 
                className="w-full border border-gray-300 rounded p-2 text-sm"
                value={formData.city}
                onChange={(e) => handleChange("city", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Adresa / Šira lokacija</label>
              <input 
                type="text" 
                className="w-full border border-gray-300 rounded p-2 text-sm"
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase mb-1">Datum</label>
                <input 
                  type="date" 
                  className="w-full border border-gray-300 rounded p-2 text-sm"
                  value={formData.date}
                  onChange={(e) => handleChange("date", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase mb-1">City Manager</label>
                <input 
                  type="text" 
                  className="w-full border border-gray-300 rounded p-2 text-sm"
                  value={formData.manager}
                  onChange={(e) => handleChange("manager", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* I. LOKALNA UPRAVA */}
          <div>
            <h3 className="text-sm font-bold bg-black text-white px-2 py-1 mb-3">I. LOKALNA UPRAVA</h3>
            <div className="space-y-3 pl-2">
              <div>
                <label className="block text-xs font-bold mb-1">Naziv institucije / odjela</label>
                <input 
                  type="text" 
                  className="w-full border border-gray-300 rounded p-2 text-sm"
                  value={formData.institution}
                  onChange={(e) => handleChange("institution", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1">Kontakt osoba</label>
                  <input 
                    type="text" 
                    className="w-full border border-gray-300 rounded p-2 text-sm"
                    value={formData.contactPerson}
                    onChange={(e) => handleChange("contactPerson", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Kontakt (tel/email)</label>
                  <input 
                    type="text" 
                    className="w-full border border-gray-300 rounded p-2 text-sm"
                    value={formData.contactInfo}
                    onChange={(e) => handleChange("contactInfo", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 1. Dozvola za otvaranje */}
          <div className="border-t pt-4">
            <label className="block text-sm font-bold mb-2">1. Dozvola za otvaranje privatnog parkirališta</label>
            <p className="text-xs text-gray-600 mb-2">Je li prema važećim propisima dozvoljeno otvaranje privatnog parkirališta u blizini aerodroma?</p>
            <div className="flex gap-4 mb-2">
              {["DA", "NE", "UVJETNO"].map(opt => (
                <label key={opt} className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="permitStatus"
                    checked={formData.permitStatus === opt}
                    onChange={() => handleChange("permitStatus", opt)}
                  />
                  <span className="text-sm">{opt}</span>
                </label>
              ))}
            </div>
            {formData.permitStatus === "UVJETNO" && (
              <input 
                type="text" 
                placeholder="Navesti uvjete..."
                className="w-full border border-gray-300 rounded p-2 text-sm mt-2"
                value={formData.permitConditions}
                onChange={(e) => handleChange("permitConditions", e.target.value)}
              />
            )}
          </div>

          {/* 2. Dodatne dozvole */}
          <div className="border-t pt-4">
            <label className="block text-sm font-bold mb-2">2. Dodatne dozvole</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={formData.additionalPermits.length === 0 && !formData.otherPermit}
                  onChange={() => {
                    handleChange("additionalPermits", []);
                    handleChange("otherPermit", "");
                  }}
                />
                <span className="text-sm">NE, nisu potrebne dodatne dozvole</span>
              </label>
              
              <p className="text-xs font-bold mt-2">DA, potrebne su sljedeće:</p>
              <div className="grid grid-cols-2 gap-2 pl-4">
                {["Komunalna", "Prometna", "Turistička", "Građevinska"].map(p => (
                  <label key={p} className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      checked={formData.additionalPermits.includes(p)}
                      onChange={() => toggleArrayItem("additionalPermits", p)}
                    />
                    <span className="text-sm">{p}</span>
                  </label>
                ))}
              </div>
              <div className="pl-4 mt-2">
                <input 
                  type="text" 
                  placeholder="Drugo..."
                  className="w-full border border-gray-300 rounded p-2 text-sm"
                  value={formData.otherPermit}
                  onChange={(e) => handleChange("otherPermit", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* 3. Posebne zone */}
          <div className="border-t pt-4">
            <label className="block text-sm font-bold mb-2">3. Posebne ili zabranjene zone</label>
            <div className="flex gap-4 mb-2">
              <label className="flex items-center gap-2">
                <input 
                  type="radio" 
                  name="specialZone"
                  checked={!formData.specialZone}
                  onChange={() => handleChange("specialZone", false)}
                />
                <span className="text-sm">NE</span>
              </label>
              <label className="flex items-center gap-2">
                <input 
                  type="radio" 
                  name="specialZone"
                  checked={formData.specialZone}
                  onChange={() => handleChange("specialZone", true)}
                />
                <span className="text-sm">DA</span>
              </label>
            </div>
            {formData.specialZone && (
              <textarea 
                placeholder="Navesti naziv zone, udaljenost i ograničenja..."
                className="w-full border border-gray-300 rounded p-2 text-sm mt-2 h-20"
                value={formData.specialZoneDetails}
                onChange={(e) => handleChange("specialZoneDetails", e.target.value)}
              />
            )}
          </div>

          {/* 4. Znakovi */}
          <div className="border-t pt-4">
            <label className="block text-sm font-bold mb-2">4. Znakovi i označavanje</label>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <p className="text-xs text-gray-600 mb-1">Dozvoljena vrsta znakova:</p>
                <div className="flex gap-4">
                  {["Pomični", "Stalni", "Oboje"].map(opt => (
                    <label key={opt} className="flex items-center gap-2">
                      <input 
                        type="radio" 
                        name="signType"
                        checked={formData.signType === opt}
                        onChange={() => handleChange("signType", opt)}
                      />
                      <span className="text-sm">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Minimalna udaljenost od ceste (m):</p>
                <input 
                  type="number" 
                  className="w-24 border border-gray-300 rounded p-2 text-sm"
                  value={formData.signDistance}
                  onChange={(e) => handleChange("signDistance", e.target.value)}
                />
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">QR kod na znakovima:</p>
                <div className="flex gap-4">
                  {["Dozvoljen", "Nije dozvoljen", "Nije jasno definirano"].map(opt => (
                    <label key={opt} className="flex items-center gap-2">
                      <input 
                        type="radio" 
                        name="qrCode"
                        checked={formData.qrCode === opt}
                        onChange={() => handleChange("qrCode", opt)}
                      />
                      <span className="text-sm">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 5. Kamperi */}
          <div className="border-t pt-4">
            <label className="block text-sm font-bold mb-2">5. Parking za kampere</label>
            <div className="flex gap-4 mb-2">
              {["DA", "NE"].map(opt => (
                <label key={opt} className="flex items-center gap-2">
                  <input 
                    type="radio" 
                    name="campersAllowed"
                    checked={formData.campersAllowed === opt}
                    onChange={() => handleChange("campersAllowed", opt)}
                  />
                  <span className="text-sm">{opt}</span>
                </label>
              ))}
            </div>
            
            {formData.campersAllowed === "DA" && (
              <div className="pl-4 space-y-3 mt-2 bg-gray-50 p-3 rounded">
                <div className="flex gap-4">
                  {["U istoj zoni", "Isključivo u posebnoj kamperskoj zoni"].map(opt => (
                    <label key={opt} className="flex items-center gap-2">
                      <input 
                        type="radio" 
                        name="camperZoneType"
                        checked={formData.camperZoneType === opt}
                        onChange={() => handleChange("camperZoneType", opt)}
                      />
                      <span className="text-sm">{opt}</span>
                    </label>
                  ))}
                </div>
                
                <div>
                  <p className="text-xs font-bold mb-1">Posebni uvjeti:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {["Zbrinjavanje otpada", "Opskrba vodom", "Ograničenje boravka", "Prijava boravka"].map(cond => (
                      <label key={cond} className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          checked={formData.camperConditions.includes(cond)}
                          onChange={() => toggleArrayItem("camperConditions", cond)}
                        />
                        <span className="text-sm">{cond}</span>
                      </label>
                    ))}
                  </div>
                  <input 
                    type="text" 
                    placeholder="Drugo..."
                    className="w-full border border-gray-300 rounded p-2 text-sm mt-2"
                    value={formData.camperOther}
                    onChange={(e) => handleChange("camperOther", e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Commentary */}
          <div className="border-t pt-4">
            <label className="block text-sm font-bold mb-2">Napomena – lokalna uprava (City Manager Commentary)</label>
            <textarea 
              className="w-full border border-gray-300 rounded p-2 text-sm h-32"
              placeholder="Unesite dodatne napomene..."
              value={formData.commentary}
              onChange={(e) => handleChange("commentary", e.target.value)}
            />
          </div>

        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 flex justify-end gap-2 z-20">
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
