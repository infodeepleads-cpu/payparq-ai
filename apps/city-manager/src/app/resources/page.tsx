"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

type ResourceCategory = "Notes" | "Legal & Finance" | "Follow Up Materials" | "Mentorship";

interface ResourceItem {
  id: string;
  nameKey: string;
  category: ResourceCategory;
  categoryKey: string;
  fileName?: string;
  link?: string;
  linkLabelKey?: string;
}

export default function Page() {
  const { t } = useLanguage();

  const resources: ResourceItem[] = [
    // Notes
    { id: "notes-main", nameKey: "my_notes", category: "Notes", categoryKey: "notes_category", link: "/resources/notes", linkLabelKey: "view_notes" },

    // Legal & Finance
    { id: "lf-contracts", nameKey: "contracts", category: "Legal & Finance", categoryKey: "legal_finance", link: "https://www.payparq.com/terms", linkLabelKey: "contracts" },
    { id: "lf-invoices", nameKey: "invoices", category: "Legal & Finance", categoryKey: "legal_finance", link: "https://www.stripe.com", linkLabelKey: "invoices" },
    { id: "lf-compliance", nameKey: "compliance", category: "Legal & Finance", categoryKey: "legal_finance", link: "https://www.payparq.com/privacy", linkLabelKey: "compliance" },

    // Follow Up Materials
    { id: "fu-legal-ref", nameKey: "legal_reference", category: "Follow Up Materials", categoryKey: "follow_up_materials", link: "https://www.payparq.com/legal", linkLabelKey: "legal_reference" },
    { id: "fu-testimonials", nameKey: "testimonials", category: "Follow Up Materials", categoryKey: "follow_up_materials", link: "https://www.payparq.com/parking", linkLabelKey: "testimonials" },
    { id: "fu-demos", nameKey: "demos", category: "Follow Up Materials", categoryKey: "follow_up_materials", link: "https://www.payparq.com/news", linkLabelKey: "demos" },
    { id: "fu-case-studies", nameKey: "case_studies", category: "Follow Up Materials", categoryKey: "follow_up_materials", link: "https://www.payparq.com/news", linkLabelKey: "case_studies" },
    { id: "fu-audits", nameKey: "audits", category: "Follow Up Materials", categoryKey: "follow_up_materials", link: "mailto:payparq@outlook.com", linkLabelKey: "audits" },
    { id: "fu-presentation", nameKey: "presentation", category: "Follow Up Materials", categoryKey: "follow_up_materials", link: "https://www.payparq.com/about", linkLabelKey: "presentation" },
    { id: "fu-security", nameKey: "security", category: "Follow Up Materials", categoryKey: "follow_up_materials", link: "https://www.payparq.com/security", linkLabelKey: "security" },
    { id: "fu-pricing", nameKey: "pricing", category: "Follow Up Materials", categoryKey: "follow_up_materials", link: "https://www.payparq.com/product", linkLabelKey: "pricing" },

    // Mentorship
    { id: "m-product", nameKey: "product", category: "Mentorship", categoryKey: "mentorship_category", link: "https://www.payparq.com/product", linkLabelKey: "product" },
    { id: "m-sales", nameKey: "sales", category: "Mentorship", categoryKey: "mentorship_category", link: "/resources/sales-rules", linkLabelKey: "sales_rules_label" },
    { id: "m-ops", nameKey: "ops_mastery", category: "Mentorship", categoryKey: "mentorship_category", link: "/resources/ops-mastery", linkLabelKey: "non_negotiables" },
    { id: "m-review", nameKey: "review_management", category: "Mentorship", categoryKey: "mentorship_category", link: "/resources/review-management", linkLabelKey: "reviews_trust" },
    { id: "m-objection", nameKey: "objection_handling", category: "Mentorship", categoryKey: "mentorship_category", link: "/resources/objection-handling", linkLabelKey: "common_objections_legal" },
    { id: "m-scripts", nameKey: "scripts", category: "Mentorship", categoryKey: "mentorship_category", link: "/resources/scripts", linkLabelKey: "personalized_outreach" },
    { id: "m-3keys", nameKey: "three_biggest_problems", category: "Mentorship", categoryKey: "mentorship_category", link: "/resources/mentorship", linkLabelKey: "three_biggest_problems" },
  ];

  const categories = [
    { id: "Notes", key: "notes_category" },
    { id: "Legal & Finance", key: "legal_finance" },
    { id: "Follow Up Materials", key: "follow_up_materials" },
    { id: "Mentorship", key: "mentorship_category" },
  ];

  return (
    <div className="h-screen bg-white overflow-y-auto overflow-x-hidden">
      <div className="max-w-3xl w-full mx-auto px-1 md:px-0 pt-4 pb-32 overflow-x-hidden">
        <div className="flex items-center border-b border-gray-100 mb-4 pb-2 pl-2">
          <span className="text-xs font-semibold tracking-tight text-black mr-4 uppercase">{t('resources')}</span>
        </div>

        <div className="grid grid-cols-1 gap-4 overflow-x-hidden">
          {categories.map((category) => (
            <div key={category.id}>
              <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 pl-2">
                {t(category.key)}
              </h2>
              <div className="flex flex-col space-y-1">
                {resources
                  .filter(r => r.category === category.id)
                  .map((item) => (
                    <div 
                      key={item.id} 
                      className="group border-b border-gray-100 py-3 hover:bg-gray-50 transition-colors px-2 rounded-lg flex flex-col items-start gap-1"
                    >
                      <span className="text-xs font-bold text-black shrink-0 break-words">{t(item.nameKey)}</span>
                      {item.link ? (
                        <a 
                          href={item.link} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-[10px] text-gray-500 hover:text-gray-700 underline break-all font-bold"
                        >
                          {item.linkLabelKey ? t(item.linkLabelKey) : t('view_link')}
                        </a>
                      ) : (
                        <span className="text-[10px] font-bold text-gray-400 italic">{t('no_document')}</span>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
