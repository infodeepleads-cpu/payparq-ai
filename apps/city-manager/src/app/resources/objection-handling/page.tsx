"use client";

import React from 'react';
import { useLanguage } from "@/contexts/LanguageContext";

export default function ObjectionHandlingPage() {
  const { t } = useLanguage();

  return (
    <div className="h-screen bg-white overflow-y-auto overflow-x-hidden">
      <div className="max-w-3xl w-full mx-auto px-1 md:px-0 pt-4 pb-32 overflow-x-hidden">
        <div className="flex items-center border-b border-gray-100 mb-6 pb-2">
          <span className="text-xs font-semibold tracking-tight text-black uppercase">{t('common_objections_legal_title')}</span>
        </div>
        
        <div className="space-y-12">
          {/* Objections Section */}
          <div className="space-y-8">
            <section>
              <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{t('objection_1_title')}</h2>
              <div className="text-sm text-gray-800 leading-relaxed space-y-2">
                <p><span className="font-semibold">{t('short_answer')}</span> {t('yes_fully_legal')}</p>
                <p className="font-semibold mt-2">{t('how_to_respond_verbatim')}</p>
                <p>{t('objection_1_resp_1')}</p>
                <p>{t('objection_1_resp_2')}</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>{t('public_city_parking')}</li>
                  <li>{t('private_parking_operators')}</li>
                  <li>{t('large_retail_chains')}</li>
                </ul>
                <p>{t('standard_framework')}</p>
                <p>{t('transparency_legal_terms')}</p>
                <p className="italic">{t('send_legal_page')}</p>
              </div>
            </section>

            <section>
              <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{t('objection_2_title')}</h2>
              <div className="text-sm text-gray-800 leading-relaxed space-y-2">
                <p><span className="font-semibold">{t('response_label')}</span></p>
                <p>{t('not_a_fine')}</p>
                <p>{t('daily_ticket_private')}</p>
              </div>
            </section>

            <section>
              <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{t('objection_3_title')}</h2>
              <div className="text-sm text-gray-800 leading-relaxed space-y-2">
                <p><span className="font-semibold">{t('response_label')}</span></p>
                <p>{t('signage_regulation')}</p>
                <p>{t('prioritize_resolution')}</p>
                <p className="font-bold">{t('refund_immediately')}</p>
              </div>
            </section>

            <section>
              <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{t('objection_4_title')}</h2>
              <div className="text-sm text-gray-800 leading-relaxed space-y-2">
                <p><span className="font-semibold">{t('response_label')}</span></p>
                <p>{t('price_reflects')}</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>{t('ops_24_7')}</li>
                  <li>{t('camera_infrastructure')}</li>
                  <li>{t('staff_support_logistics')}</li>
                  <li>{t('immediate_assistance')}</li>
                </ul>
                <p>{t('not_subsidized')}</p>
              </div>
            </section>

            <section>
              <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{t('objection_5_title')}</h2>
              <div className="text-sm text-gray-800 leading-relaxed space-y-2">
                <p><span className="font-semibold">{t('response_label')}</span></p>
                <p>{t('automatic_detection')}</p>
                <p>{t('understand_mistakes')}</p>
                <p>{t('policy_guest_first')}</p>
              </div>
            </section>

            <section>
              <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{t('objection_6_title')}</h2>
              <div className="text-sm text-gray-800 leading-relaxed space-y-2">
                <p><span className="font-semibold">{t('response_label')}</span></p>
                <p>{t('many_do')}</p>
                <p>{t('widely_accepted')}</p>
              </div>
            </section>

            <section>
              <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{t('objection_7_title')}</h2>
              <div className="text-sm text-gray-800 leading-relaxed space-y-2">
                <p><span className="font-semibold">{t('response_label')}</span></p>
                <p>{t('escalate_immediately')}</p>
                <p>{t('goal_resolution_minutes')}</p>
              </div>
            </section>

            <section className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h2 className="text-[10px] font-bold text-black uppercase tracking-wider mb-4">{t('golden_rule_objections')}</h2>
              <div className="text-sm text-gray-800 leading-relaxed space-y-2">
                <ul className="list-disc pl-5 space-y-2">
                  <li>{t('de_escalate_first')}</li>
                  <li>{t('be_calm_discreet')}</li>
                  <li>{t('never_argue_legality')}</li>
                  <li className="font-bold text-black">{t('guest_insists_refund')}</li>
                  <li className="font-bold text-black">{t('no_stranded_guest')}</li>
                </ul>
              </div>
            </section>
          </div>

          {/* Legal Basis Section */}
          <div className="mt-16 pt-8 border-t border-gray-200">
            <h1 className="text-xs font-bold text-black mb-8 uppercase tracking-wide">
              {t('legal_basis_title')}
            </h1>

            <div className="space-y-10">
              <section>
                <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{t('mobile_lpr_photography')}</h2>
                <div className="text-sm text-gray-800 leading-relaxed space-y-2">
                  <p>{t('lpr_legal_interest')}</p>
                  <p>{t('license_plate_operational_data')}</p>
                  <p className="mt-2 font-semibold">{t('evidentiary_standards')}</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>{t('public_city_parking')}</li>
                    <li>{t('private_parking_operators')}</li>
                    <li>{t('large_retail_chains')}</li>
                  </ul>
                  <p className="mt-2 font-semibold">{t('photos_used_document')}</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>{t('vehicle_presence')}</li>
                    <li>{t('entry_exit_time')}</li>
                    <li>{t('parking_duration')}</li>
                  </ul>
                  <p>{t('not_used_profiling')}</p>
                </div>
              </section>

              <section>
                <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{t('evidence_integrity_security')}</h2>
                <div className="text-sm text-gray-800 leading-relaxed space-y-2">
                  <p>{t('enforcement_data_collected')}</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>{t('automatic_timestamping')}</li>
                    <li>{t('gps_location_data')}</li>
                    <li>{t('cryptographic_hash')}</li>
                    <li>{t('tamper_proof_records')}</li>
                  </ul>
                  <p className="mt-2 font-semibold">{t('ensures_label')}</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>{t('photo_not_altered')}</li>
                    <li>{t('time_place_provable')}</li>
                    <li>{t('evidence_chain_intact')}</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{t('legal_validity_court')}</h2>
                <div className="text-sm text-gray-800 leading-relaxed space-y-2">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>{t('verifiable_digital_evidence')}</li>
                    <li>{t('objectively_provable')}</li>
                    <li>{t('legally_valid_enforceable')}</li>
                  </ul>
                  <p className="mt-2 font-semibold">{t('evidentiary_standards')}</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>{t('parking_disputes')}</li>
                    <li>{t('commercial_contract_enforcement')}</li>
                    <li>{t('automated_enforcement_systems')}</li>
                  </ul>
                  <p className="mt-4 italic">
                    {t('binding_private_contract')}
                  </p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
