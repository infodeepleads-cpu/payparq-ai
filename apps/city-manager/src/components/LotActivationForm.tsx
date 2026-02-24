"use client";

import { useState, useEffect, useCallback } from "react";
import { getSupabase, getCurrentUser } from "../lib/supabase";
import SignaturePad from "./SignaturePad";

interface LocationEntry {
  id: string;
  name: string;
  photos?: string[];
  ratings: {
    infrastructure: number;
    water: number;
    electricity: number;
    access: number;
    terrain: number;
    roadProximity: number;
    lighting: number;
    signagePotential: number;
    location: number;
  };
}

interface LotActivationFormProps {
  onClose: () => void;
  onSave: (data: any) => void;
  initialData?: any;
  tier: number;
}

export default function LotActivationForm({ onClose, onSave, initialData, tier }: LotActivationFormProps) {
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<LocationEntry[]>(initialData?.locations || [
    { 
      id: crypto.randomUUID(), 
      name: "", 
      ratings: {
        infrastructure: 5,
        water: 5,
        electricity: 5,
        access: 5,
        terrain: 5,
        roadProximity: 5,
        lighting: 5,
        signagePotential: 5,
        location: 5
      }
    }
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
        type: "lot_activation",
        content: JSON.stringify({ locations, signature, date, time }, null, 2),
        status: "pending"
      });

      if (error) {
        console.error("Submission failed", error);
        alert(`Failed to submit document: ${error.message || JSON.stringify(error)}`);
        setLoading(false);
        return;
      }

      alert("Lot Activation List submitted successfully! It is now under review.");
      onSave({ locations, signature, date, time });
      onClose();
      
    } catch (e: any) {
      console.error("Error submitting document:", e);
      alert(`An unexpected error occurred: ${e.message || e}`);
      setLoading(false);
    }
  };

  const addLocation = () => {
    setLocations([
      ...locations,
      { 
        id: crypto.randomUUID(), 
        name: "", 
        ratings: {
          infrastructure: 5,
          water: 5,
          electricity: 5,
          access: 5,
          terrain: 5,
          roadProximity: 5,
          lighting: 5,
          signagePotential: 5,
          location: 5
        }
      }
    ]);
  };

  const removeLocation = (id: string) => {
    if (locations.length > 1) {
      setLocations(locations.filter(l => l.id !== id));
    }
  };

  const handleNameChange = (id: string, value: string) => {
    setLocations(locations.map(l => 
      l.id === id ? { ...l, name: value } : l
    ));
  };

  const handleRatingChange = (id: string, field: keyof LocationEntry['ratings'], value: number) => {
    setLocations(locations.map(l => 
      l.id === id ? { 
        ...l, 
        ratings: { ...l.ratings, [field]: value } 
      } : l
    ));
  };

  const ratingFields = [
    { key: "infrastructure", label: "Infrastruktura" },
    { key: "water", label: "Voda" },
    { key: "electricity", label: "Struja" },
    { key: "access", label: "Pristup" },
    { key: "terrain", label: "Teren" },
    { key: "roadProximity", label: "Blizina ceste" },
    { key: "lighting", label: "Rasvjeta" },
    { key: "signagePotential", label: "Postavljanje znaka potencijal" },
    { key: "location", label: "Lokacija" },
  ] as const;

  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Canvas to Blob failed"));
          }, 'image/jpeg', 0.7);
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const handlePhotoUpload = async (id: string, files: FileList | null) => {
    if (!files) return;
    
    const loc = locations.find(l => l.id === id);
    if (!loc) return;
    
    const currentCount = loc.photos?.length || 0;
    const remainingSlots = 5 - currentCount;
    
    if (remainingSlots <= 0) return;
    
    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    
    for (const file of filesToUpload) {
      try {
        const compressedBlob = await compressImage(file);
        const compressedFile = new File([compressedBlob], file.name, { type: 'image/jpeg' });
        
        const supabase = getSupabase();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
        const { data, error } = await supabase.storage
          .from('lot-photos')
          .upload(`public/${fileName}`, compressedFile);
        
        if (error) throw error;
        
        const { data: { publicUrl } } = supabase.storage
          .from('lot-photos')
          .getPublicUrl(`public/${fileName}`);
        
        setLocations(prev => prev.map(l => {
          if (l.id === id) {
            return {
              ...l,
              photos: [...(l.photos || []), publicUrl]
            };
          }
          return l;
        }));
        
      } catch (err) {
        console.error("Upload failed", err);
        // Fallback to local preview if upload fails or offline
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            setLocations(prev => prev.map(l => {
            if (l.id === id) {
                return {
                ...l,
                photos: [...(l.photos || []), reader.result as string]
                };
            }
            return l;
            }));
        };
      }
    }
  };

  const removePhoto = (locId: string, photoIndex: number) => {
    setLocations(prev => prev.map(l => {
      if (l.id === locId) {
        const newPhotos = [...(l.photos || [])];
        newPhotos.splice(photoIndex, 1);
        return { ...l, photos: newPhotos };
      }
      return l;
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[2000] p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex justify-between items-center z-20">
          <h2 className="text-lg font-bold text-black">LOT ACTIVATION LIST</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-black">✕</button>
        </div>
        
        <div className="p-6 space-y-8">
          {locations.map((loc, index) => (
            <div key={loc.id} className="relative bg-gray-50 p-6 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold uppercase">Location #{index + 1}</h3>
                {locations.length > 1 && (
                  <button 
                    onClick={() => removeLocation(loc.id)}
                    className="text-red-500 text-xs hover:text-red-700 font-medium"
                  >
                    REMOVE
                  </button>
                )}
              </div>
              
              <div className="mb-6">
                <label className="block text-xs font-bold uppercase mb-2">Naziv lokacije / Adresa</label>
                <input 
                  type="text" 
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck="false"
                  className="w-full border border-gray-300 rounded p-2 text-sm"
                  value={loc.name}
                  onChange={(e) => handleNameChange(loc.id, e.target.value)}
                  placeholder="Enter location name or address"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                {ratingFields.map(({ key, label }) => (
                  <div key={key} className="bg-white p-3 rounded border border-gray-100 shadow-sm">
                    <label className="block text-xs font-bold text-gray-700 mb-2 truncate" title={label}>
                      {label}
                    </label>
                    <div className="flex items-center gap-3">
                      <input 
                        type="range" 
                        min="1" 
                        max="10" 
                        value={loc.ratings[key]}
                        onChange={(e) => handleRatingChange(loc.id, key, parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
                      />
                      <span className="text-sm font-bold w-6 text-center">{loc.ratings[key]}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Photos Section */}
              <div className="bg-gray-100 p-4 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-xs font-bold uppercase">Photos (Max 5)</label>
                  <span className="text-xs text-gray-500">{(loc.photos || []).length}/5</span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {(loc.photos || []).map((photo, i) => (
                    <div key={i} className="relative aspect-square bg-gray-200 rounded overflow-hidden group">
                      <img src={photo} alt={`Lot ${index + 1} photo ${i + 1}`} className="w-full h-full object-cover" />
                      <button 
                        onClick={() => removePhoto(loc.id, i)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  
                  {(loc.photos || []).length < 5 && (
                    <label className="aspect-square border-2 border-dashed border-gray-300 rounded flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors">
                      <span className="text-2xl text-gray-400">+</span>
                      <span className="text-[10px] text-gray-500 font-bold mt-1 uppercase">Add Photo</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        multiple 
                        className="hidden"
                        onChange={(e) => handlePhotoUpload(loc.id, e.target.files)}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
          ))}

          <button 
            onClick={addLocation}
            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 font-medium transition-colors flex items-center justify-center gap-2"
          >
            <span className="text-xl">+</span> ADD ANOTHER LOCATION
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
            onClick={() => {
              const missingPhotos = locations.some(l => (l.photos || []).length === 0);
              if (missingPhotos) {
                alert("Please upload at least one photo for each location.");
                return;
              }
              onSave({ locations, signature, date, time });
            }}
            className="px-4 py-2 text-sm font-bold bg-black text-white rounded hover:bg-gray-800"
          >
            Save List
          </button>
        </div>
      </div>
    </div>
  );
}
