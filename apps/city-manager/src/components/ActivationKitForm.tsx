"use client";

import { useState, useEffect, useCallback } from "react";
import { getSupabase, getCurrentUser } from "../lib/supabase";
import SignaturePad from "./SignaturePad";

interface ActivationKitFormProps {
  onClose: () => void;
  onSave: (data: any) => void;
  initialData?: any;
  tier: number;
}

export default function ActivationKitForm({ onClose, onSave, initialData, tier }: ActivationKitFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(initialData || {
    city: "",
    address: "",
    date: "",
    managerName: "",
    ownerContact: "",
    
    // I. PRIPREMA
    prep_id: false,
    prep_tablet: false,
    prep_demo: false,
    prep_spray: false,
    prep_stickers: false,
    prep_meter: false,
    prep_survey: false,
    prep_note: "",

    // II. SASTANAK
    meeting_intro_greeting: false,
    meeting_intro_target: false,
    meeting_model_explained: false,
    meeting_model_risk: false,
    meeting_model_cost: false,
    meeting_demo_admin: false,
    meeting_demo_web: false,
    meeting_demo_app: false,
    meeting_demo_account: false,
    meeting_activation_account: false,
    meeting_activation_email: false,
    meeting_activation_payment: false,
    meeting_stripe_weekly: false,
    meeting_stripe_monthly: false,

    // III. ISHOD
    outcome_activated: null, // "YES" | "NO"

    // IV. DA (AKTIVACIJA)
    act_mark_lines: false,
    act_mark_sticker: false,
    act_count_spots: false,
    act_total_spots: "",
    act_media_photo_terrain: false,
    act_media_photo_res: false,
    act_media_photo_gmaps: false,
    act_media_video_short: false,
    act_media_video_walk: false,
    act_media_video_gmaps: false,
    act_send_photo: false,
    act_send_video: false,
    act_send_location: false,
    act_send_date_method: "",

    // V. NE (ODBIJANJE)
    rej_survey: false,
    rej_reasons: false,
    rej_sent: false,
    rej_summary: "",

    // VI. FOLLOW-UP
    fup_1_written: false,
    fup_1_brochure: false,
    fup_1_materials: false,
    fup_2_audit: false,
    fup_2_3d: false,
    fup_2_est: false,
    fup_2_date: "",

    // VII. NEDJELJNI OBILAZAK
    wk_plaque: false,
    wk_poles: false,
    wk_sticker_temp: false,
    wk_ana_camera: false,
    wk_ana_lpr: false,
    wk_ana_sign_pos: false,
    wk_ana_sign_size: false,
    wk_ana_sign_count: false,
    wk_tech_note: "",

    // VIII. ZAVRŠNA
    final_signature: "",
    final_date: new Date().toISOString().split('T')[0],
    final_time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: "2-digit", minute: "2-digit" })
  });

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSignatureChange = useCallback((signature: string | null) => {
    setFormData((prev: any) => ({ ...prev, final_signature: signature }));
  }, []);

  const Checkbox = ({ field, label }: { field: string, label: string }) => (
    <label className="flex items-start gap-3 cursor-pointer group">
      <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
        formData[field] ? "bg-black border-black" : "border-gray-300 bg-white group-hover:border-gray-400"
      }`}>
        {formData[field] && (
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <input 
        type="checkbox" 
        className="hidden"
        checked={formData[field]}
        onChange={(e) => handleChange(field, e.target.checked)}
      />
      <span className="text-sm text-gray-700 leading-tight select-none">{label}</span>
    </label>
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <h3 className="text-sm font-bold uppercase bg-gray-100 p-2 rounded text-black mt-6 mb-4">
      {title}
    </h3>
  );

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
        type: "hub_activation",
        content: JSON.stringify(formData, null, 2),
        status: "pending"
      });

      if (error) {
        console.error("Submission failed", error);
        alert(`Failed to submit document: ${error.message || JSON.stringify(error)}`);
        setLoading(false);
        return;
      }

      alert("HUB Activation Form submitted successfully! It is now under review.");
      onSave(formData);
      onClose();
      
    } catch (e: any) {
      console.error("Error submitting document:", e);
      alert(`An unexpected error occurred: ${e.message || e}`);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[2000] p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex justify-between items-center z-20">
          <h2 className="text-lg font-bold text-black">HUB ACTIVATION FORM</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-black">✕</button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Header Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Grad / Lokacija</label>
              <input 
                type="text" 
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck="false"
                className="w-full border border-gray-300 rounded p-2 text-sm"
                value={formData.city}
                onChange={(e) => handleChange("city", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Adresa lokacije</label>
              <input 
                type="text" 
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck="false"
                className="w-full border border-gray-300 rounded p-2 text-sm"
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Datum</label>
              <input 
                type="date" 
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck="false"
                className="w-full border border-gray-300 rounded p-2 text-sm"
                value={formData.date}
                onChange={(e) => handleChange("date", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Ime i prezime City Managera</label>
              <input 
                type="text" 
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck="false"
                className="w-full border border-gray-300 rounded p-2 text-sm"
                value={formData.managerName}
                onChange={(e) => handleChange("managerName", e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase mb-1">Kontakt vlasnika / predstavnika</label>
              <input 
                type="text" 
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck="false"
                className="w-full border border-gray-300 rounded p-2 text-sm"
                value={formData.ownerContact}
                onChange={(e) => handleChange("ownerContact", e.target.value)}
              />
            </div>
          </div>

          <SectionHeader title="I. PRIPREMA (CHECKLIST PRIJE SASTANKA)" />
          <div className="space-y-3 pl-2">
            <Checkbox field="prep_id" label="Akreditacija / identifikacija" />
            <Checkbox field="prep_tablet" label="Tablet / laptop" />
            <Checkbox field="prep_demo" label="Pristup web / app / admin DEMO sustavu" />
            <Checkbox field="prep_spray" label="Bijeli sprej za označavanje" />
            <Checkbox field="prep_stickers" label="Naljepnice" />
            <Checkbox field="prep_meter" label="Metar" />
            <Checkbox field="prep_survey" label="Spremna anketa (za slučaj odbijanja)" />
            <div className="mt-2">
              <label className="block text-xs font-bold uppercase mb-1">Napomena (priprema)</label>
              <textarea 
                className="w-full border border-gray-300 rounded p-2 text-sm h-20"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck="false"
                value={formData.prep_note}
                onChange={(e) => handleChange("prep_note", e.target.value)}
              />
            </div>
          </div>

          <SectionHeader title="II. SASTANAK – TIJEK I SADRŽAJ" />
          <div className="space-y-4 pl-2">
            <div>
              <h4 className="font-bold text-sm mb-2">1. Uvod i predstavljanje</h4>
              <div className="space-y-2">
                <Checkbox field="meeting_intro_greeting" label="Pozdrav i predstavljanje tko smo" />
                <Checkbox field="meeting_intro_target" label="Objašnjeno za koga je ponuda (stabilnost i sigurnost, nije za onoga tko želi lovu na brzinu, parking ugovori su dugoročne prirode, 5-10 godina industrijski standard)" />
              </div>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-2">2. Poslovni model</h4>
              <div className="space-y-2">
                <Checkbox field="meeting_model_explained" label="Objašnjen model zarade" />
                <Checkbox field="meeting_model_risk" label="Naglašeno: bez rizika za vlasnika" />
                <Checkbox field="meeting_model_cost" label="Naglašeno: bez inicijalnog troška" />
              </div>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-2">3. Prezentacija (DEMO)</h4>
              <div className="space-y-2">
                <Checkbox field="meeting_demo_admin" label="Admin sučelje" />
                <Checkbox field="meeting_demo_web" label="Web rezervacija" />
                <Checkbox field="meeting_demo_app" label="Mobilna aplikacija" />
                <Checkbox field="meeting_demo_account" label="Korisnički / partnerski račun" />
              </div>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-2">4. Aktivacija i isplate</h4>
              <div className="space-y-2">
                <Checkbox field="meeting_activation_account" label="Kreiran korisnički račun" />
                <Checkbox field="meeting_activation_email" label="Unesen email" />
                <Checkbox field="meeting_activation_payment" label="Objašnjen sustav isplata" />
                <div className="ml-6 mt-2">
                  <p className="text-xs font-bold mb-1">Isplate putem Stripea:</p>
                  <div className="flex gap-4">
                    <Checkbox field="meeting_stripe_weekly" label="Tjedno" />
                    <Checkbox field="meeting_stripe_monthly" label="Mjesečno" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <SectionHeader title="III. ISHOD SASTANKA" />
          <div className="pl-2">
            <p className="font-bold text-sm mb-2">Je li lokacija aktivirana?</p>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="outcome"
                  className="accent-black"
                  checked={formData.outcome_activated === "YES"}
                  onChange={() => handleChange("outcome_activated", "YES")}
                />
                <span className="text-sm">DA – lokacija aktivirana</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="outcome"
                  className="accent-black"
                  checked={formData.outcome_activated === "NO"}
                  onChange={() => handleChange("outcome_activated", "NO")}
                />
                <span className="text-sm">NE – aktivacija odbijena</span>
              </label>
            </div>
          </div>

          {formData.outcome_activated === "YES" && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-300">
              <SectionHeader title="IV. AKO JE ODGOVOR DA (AKTIVACIJA)" />
              <div className="space-y-4 pl-2">
                <div>
                  <h4 className="font-bold text-sm mb-2">1. Označavanje lokacije</h4>
                  <div className="space-y-2">
                    <Checkbox field="act_mark_lines" label="Označene vanjske crte (naglasak)" />
                    <Checkbox field="act_mark_sticker" label="Postavljena naljepnica" />
                    <Checkbox field="act_count_spots" label="Izbrojan broj parkirnih mjesta" />
                    <div className="ml-6 mt-2 space-y-2">
                      <p className="text-sm">Dimenzije mjesta: <span className="font-bold">5 × 2,5 m</span></p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Ukupan broj mjesta:</span>
                        <input 
                          type="number"
                          autoComplete="off"
                          autoCorrect="off"
                          autoCapitalize="none"
                          spellCheck="false"
                          className="border border-gray-300 rounded p-1 text-sm w-24"
                          value={formData.act_total_spots}
                          onChange={(e) => handleChange("act_total_spots", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-sm mb-2">2. Medijski materijali</h4>
                  <div className="space-y-2">
                    <Checkbox field="act_media_photo_terrain" label="Fotografije terena (min. 15 komada)" />
                    <Checkbox field="act_media_photo_res" label="Kvalitetne fotografije za rezervacije" />
                    <Checkbox field="act_media_photo_gmaps" label="Fotografije za Google Maps" />
                    <div className="mt-2">
                      <p className="text-xs font-bold mb-1">Video materijali:</p>
                      <Checkbox field="act_media_video_short" label="10 kratkih videa (društvene mreže)" />
                      <Checkbox field="act_media_video_walk" label="1 detaljni video (walkthrough)" />
                      <Checkbox field="act_media_video_gmaps" label="1 video za Google Maps verifikaciju" />
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-sm mb-2">3. Slanje materijala</h4>
                  <div className="space-y-2">
                    <Checkbox field="act_send_photo" label="Poslane fotografije" />
                    <Checkbox field="act_send_video" label="Poslani video materijali" />
                    <Checkbox field="act_send_location" label="Poslana točna lokacija (pin / adresa)" />
                    <div className="mt-2">
                      <label className="block text-xs font-bold uppercase mb-1">Datum i način slanja</label>
                      <input 
                        type="text" 
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="none"
                        spellCheck="false"
                        className="w-full border border-gray-300 rounded p-2 text-sm"
                        value={formData.act_send_date_method}
                        onChange={(e) => handleChange("act_send_date_method", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {formData.outcome_activated === "NO" && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-300">
              <SectionHeader title="V. AKO JE ODGOVOR NE (ODBIJANJE AKTIVACIJE)" />
              <div className="space-y-3 pl-2">
                <Checkbox field="rej_survey" label="Ispunjena anketa (5 pitanja)" />
                <Checkbox field="rej_reasons" label="Zabilježeni razlozi odbijanja" />
                <Checkbox field="rej_sent" label="Rezultati poslani timu" />
                <div className="mt-2">
                  <label className="block text-xs font-bold uppercase mb-1">Sažetak razloga odbijanja</label>
                  <textarea 
                    className="w-full border border-gray-300 rounded p-2 text-sm h-24"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck="false"
                    value={formData.rej_summary}
                    onChange={(e) => handleChange("rej_summary", e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          <SectionHeader title="VI. FOLLOW-UP AKTIVNOSTI" />
          <div className="space-y-4 pl-2">
            <div>
              <h4 className="font-bold text-sm mb-2">1. Prvi follow-up (isti dan)</h4>
              <div className="space-y-2">
                <Checkbox field="fup_1_written" label="Rukom pisani follow-up" />
                <Checkbox field="fup_1_brochure" label="Predana / poslana brosura" />
                <Checkbox field="fup_1_materials" label="Poslani materijali i linkovi" />
              </div>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-2">2. Drugi follow-up</h4>
              <div className="space-y-2">
                <Checkbox field="fup_2_audit" label="Ponuda besplatnog audita" />
                <Checkbox field="fup_2_3d" label="3D prikaz / simulacija" />
                <Checkbox field="fup_2_est" label="Procjena zarade" />
                <div className="mt-2">
                  <label className="block text-xs font-bold uppercase mb-1">Planirani datum</label>
                  <input 
                    type="date" 
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck="false"
                    className="w-full border border-gray-300 rounded p-2 text-sm"
                    value={formData.fup_2_date}
                    onChange={(e) => handleChange("fup_2_date", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <SectionHeader title="VII. NEDJELJNI OBILAZAK LOKACIJE" />
          <div className="space-y-3 pl-2">
            <Checkbox field="wk_plaque" label="Postavljena A3 plaketa" />
            <Checkbox field="wk_poles" label="Postavljene šipke za fotografiranje" />
            <Checkbox field="wk_sticker_temp" label="Privremena naljepnica postavljena" />
            <div className="mt-2">
              <p className="text-xs font-bold mb-1">Analiza na terenu:</p>
              <Checkbox field="wk_ana_camera" label="Pozicija solarne kamere" />
              <Checkbox field="wk_ana_lpr" label="LPR sustav" />
              <Checkbox field="wk_ana_sign_pos" label="Pozicije znakova" />
              <Checkbox field="wk_ana_sign_size" label="Veličina znakova" />
              <Checkbox field="wk_ana_sign_count" label="Broj znakova" />
            </div>
            <div className="mt-2">
              <label className="block text-xs font-bold uppercase mb-1">Napomena – tehnička analiza</label>
              <textarea 
                className="w-full border border-gray-300 rounded p-2 text-sm h-20"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck="false"
                value={formData.wk_tech_note}
                onChange={(e) => handleChange("wk_tech_note", e.target.value)}
              />
            </div>
          </div>

          <SectionHeader title="VIII. ZAVRŠNA NAPOMENA" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-2">
            <div>
              <SignaturePad 
                onChange={handleSignatureChange} 
                initialSignature={formData.final_signature} 
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Datum i Vrijeme</label>
              <div className="flex gap-2">
                <input 
                  type="date" 
                  className="w-full border border-gray-300 rounded p-2 text-sm"
                  value={formData.final_date}
                  onChange={(e) => handleChange("final_date", e.target.value)}
                />
                <input 
                  type="time" 
                  className="w-full border border-gray-300 rounded p-2 text-sm"
                  value={formData.final_time}
                  onChange={(e) => handleChange("final_time", e.target.value)}
                />
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
            onClick={() => onSave(formData)}
            className="px-4 py-2 text-sm font-bold bg-black text-white rounded hover:bg-gray-800"
          >
            Save Form
          </button>
        </div>
      </div>
    </div>
  );
}