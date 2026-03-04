"use client";

import { useLanguage } from "@/contexts/LanguageContext";

type DocumentItem = {
  id: string;
  title: string;
  href: string;
  label: string;
};

export default function DocumentsPage() {
  const { t } = useLanguage();

  const documentItems: DocumentItem[] = [
    { id: "doc-inbox", title: "Inbox Documents", href: "/inbox", label: t("inbox") },
    { id: "doc-terms", title: "Terms & Conditions", href: "https://www.payparq.com/terms", label: t("contracts") },
    { id: "doc-privacy", title: "Privacy Policy", href: "https://www.payparq.com/privacy", label: t("compliance") },
    { id: "doc-legal", title: "Legal Reference", href: "https://www.payparq.com/legal", label: t("legal_reference") },
    { id: "doc-presentation", title: "Presentation", href: "https://www.payparq.com/about", label: t("presentation") },
    { id: "doc-security", title: "Security", href: "https://www.payparq.com/security", label: t("security") }
  ];

  return (
    <div className="h-screen bg-white overflow-y-auto overflow-x-hidden">
      <div className="max-w-3xl w-full mx-auto px-1 md:px-0 pt-4 pb-32 overflow-x-hidden">
        <div className="flex items-center border-b border-gray-100 mb-4 pb-2 pl-2">
          <span className="text-xs font-semibold tracking-tight text-black mr-4 uppercase">{t("documents")}</span>
        </div>

        <div className="space-y-1">
          {documentItems.map((item) => {
            const isExternal = item.href.startsWith("http");
            return (
              <div
                key={item.id}
                className="group border-b border-gray-100 py-3 hover:bg-gray-50 transition-colors px-2 rounded-lg flex flex-col items-start gap-1"
              >
                <span className="text-xs font-bold text-black shrink-0 break-words">{item.title}</span>
                <a
                  href={item.href}
                  target={isExternal ? "_blank" : undefined}
                  rel={isExternal ? "noopener noreferrer" : undefined}
                  className="text-[10px] text-gray-500 hover:text-gray-700 underline break-all font-bold"
                >
                  {item.label}
                </a>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
