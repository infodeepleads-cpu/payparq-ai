"use client";

import { useState, useEffect } from "react";

type ResourceCategory = "Notes" | "Legal & Finance" | "Follow Up Materials" | "Mentorship";

interface ResourceItem {
  id: string;
  name: string;
  category: ResourceCategory;
  fileName?: string;
  link?: string;
  linkLabel?: string;
}

const DEFAULT_RESOURCES: ResourceItem[] = [
  // Notes
  { id: "notes-main", name: "My Notes", category: "Notes", link: "/resources/notes", linkLabel: "View Notes" },

  // Legal & Finance
  { id: "lf-contracts", name: "Contracts", category: "Legal & Finance", link: "https://www.payparq.com/terms", linkLabel: "www.payparq.com/terms" },
  { id: "lf-invoices", name: "Invoices", category: "Legal & Finance", link: "https://www.stripe.com", linkLabel: "www.stripe.com" },
  { id: "lf-compliance", name: "Compliance", category: "Legal & Finance", link: "https://www.payparq.com/privacy", linkLabel: "www.payparq.com/privacy" },

  // Follow Up Materials
  { id: "fu-legal-ref", name: "Legal Reference", category: "Follow Up Materials", link: "https://www.payparq.com/legal", linkLabel: "www.payparq.com/legal" },
  { id: "fu-testimonials", name: "Testimonials", category: "Follow Up Materials", link: "https://www.payparq.com/parking", linkLabel: "www.payparq.com/parking" },
  { id: "fu-demos", name: "Demos", category: "Follow Up Materials", link: "https://www.payparq.com/news", linkLabel: "www.payparq.com/news (Social Media)" },
  { id: "fu-case-studies", name: "Case Studies", category: "Follow Up Materials", link: "https://www.payparq.com/news", linkLabel: "www.payparq.com/news" },
  { id: "fu-audits", name: "Audits", category: "Follow Up Materials", link: "mailto:payparq@outlook.com", linkLabel: "payparq@outlook.com" },
  { id: "fu-presentation", name: "Presentation", category: "Follow Up Materials", link: "https://www.payparq.com/about", linkLabel: "(download overview)" },
  { id: "fu-security", name: "Security", category: "Follow Up Materials", link: "https://www.payparq.com/security", linkLabel: "www.payparq.com/security" },
  { id: "fu-pricing", name: "Pricing", category: "Follow Up Materials", link: "https://www.payparq.com/product", linkLabel: "www.payparq.com/product" },

  // Mentorship
  { id: "m-product", name: "Product", category: "Mentorship", link: "https://www.payparq.com/product", linkLabel: "www.payparq.com/product" },
  { id: "m-sales", name: "Sales", category: "Mentorship", link: "/resources/sales-rules", linkLabel: "Sales & Contact Rules" },
  { id: "m-ops", name: "Ops Mastery", category: "Mentorship", link: "/resources/ops-mastery", linkLabel: "Non-Negotiables" },
  { id: "m-review", name: "Review Management", category: "Mentorship", link: "/resources/review-management", linkLabel: "Reviews & Trust" },
  { id: "m-objection", name: "Objection Handling", category: "Mentorship", link: "/resources/objection-handling", linkLabel: "Common Objections & Legal Basis" },
  { id: "m-scripts", name: "Scripts", category: "Mentorship", link: "/resources/scripts", linkLabel: "Personalized Outreach Framework" },
  { id: "m-3keys", name: "3 Biggest Problems We Solve", category: "Mentorship", link: "/resources/mentorship", linkLabel: "3 Biggest Problems We Solve" },
];

export default function Page() {
  const resources = DEFAULT_RESOURCES;

  const categories: ResourceCategory[] = [
    "Notes",
    "Legal & Finance", 
    "Follow Up Materials", 
    "Mentorship", 
  ];

  return (
    <div className="h-screen bg-white overflow-y-auto overflow-x-hidden">
      <div className="max-w-3xl w-full mx-auto px-1 md:px-0 pt-4 pb-32 overflow-x-hidden">
        <div className="flex items-center border-b border-gray-100 mb-4 pb-2 pl-2">
          <span className="text-xs font-semibold tracking-tight text-black mr-4">RESOURCES</span>
        </div>

        <div className="grid grid-cols-1 gap-4 overflow-x-hidden">
          {categories.map((category) => (
            <div key={category}>
              <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 pl-2">
                {category}
              </h2>
              <div className="flex flex-col space-y-1">
                {resources
                  .filter(r => r.category === category)
                  .map((item) => (
                    <div 
                      key={item.id} 
                      className="group border-b border-gray-100 py-3 hover:bg-gray-50 transition-colors px-2 rounded-lg flex flex-col items-start gap-1"
                    >
                      <span className="text-xs font-bold text-black shrink-0 break-words">{item.name}</span>
                      {item.link ? (
                        <a 
                          href={item.link} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-[10px] text-gray-500 hover:text-gray-700 underline break-all font-bold"
                        >
                          {item.linkLabel || "View Link"}
                        </a>
                      ) : (
                        <span className="text-[10px] font-bold text-gray-400 italic">No Document</span>
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
