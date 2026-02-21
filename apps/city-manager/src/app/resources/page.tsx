"use client";

import { useState, useEffect } from "react";

type ResourceCategory = "Legal & Finance" | "Follow Up Materials" | "Mentorship";

interface ResourceItem {
  id: string;
  name: string;
  category: ResourceCategory;
  fileName?: string;
  link?: string;
  linkLabel?: string;
}

const DEFAULT_RESOURCES: ResourceItem[] = [
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
  { id: "m-review", name: "Review Management", category: "Mentorship", link: "/resources/review-management", linkLabel: "Outperform Expectations" },
  { id: "m-objection", name: "Objection Handling", category: "Mentorship", link: "/resources/objection-handling", linkLabel: "Common Objections & Legal Basis" },
  { id: "m-scripts", name: "Scripts", category: "Mentorship", link: "/resources/scripts", linkLabel: "Personalized Outreach Framework" },
  { id: "m-3keys", name: "3 Key Solutions", category: "Mentorship", link: "/resources/mentorship", linkLabel: "3 Key Solutions" },
];

export default function Page() {
  const resources = DEFAULT_RESOURCES;

  const categories: ResourceCategory[] = [
    "Legal & Finance", 
    "Follow Up Materials", 
    "Mentorship", 
  ];

  return (
    <div className="h-screen bg-white overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 md:px-0 py-6">
        <div className="flex items-center justify-between mb-6 border-b border-black pb-2">
          <h1 className="text-xl font-bold tracking-tight text-black">RESOURCES</h1>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {categories.map((category) => (
            <div key={category}>
              <h2 className="text-xs font-bold text-black uppercase tracking-wider mb-3 border-b border-gray-100 pb-1">
                {category}
              </h2>
              <div className="flex flex-col">
                {resources
                  .filter(r => r.category === category)
                  .map((item) => (
                    <div 
                      key={item.id} 
                      className="flex items-center justify-between py-2 px-2 border-b border-gray-100 transition-colors hover:bg-gray-50"
                    >
                      <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">{item.name}</span>
                      {item.link ? (
                        <a 
                          href={item.link} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-xs font-bold text-black hover:text-gray-700 underline"
                        >
                          {item.linkLabel || "View Link"}
                        </a>
                      ) : (
                        <span className="text-xs font-bold text-gray-400 italic">No Document</span>
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
