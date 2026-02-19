 "use client";
 import { usePathname } from "next/navigation";
 
 const tabs = [
   { href: "/", label: "Chat" },
   { href: "/inbox", label: "Inbox" },
   { href: "/mission", label: "Mission" },
   { href: "/espresso", label: "Espresso" },
   { href: "/daily-recap", label: "Daily Recap" },
   { href: "/crm", label: "CRM" },
   { href: "/resources", label: "Resources" }
 ];
 
 export default function Taskbar() {
   const pathname = usePathname() || "/";
   return (
     <div className="hidden md:flex justify-center sticky top-0 z-30 bg-white/80 backdrop-blur-sm">
      <div className="max-w-3xl w-full mx-auto px-0 py-0.5 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-2">
          {tabs.map(t => {
            const active = pathname === t.href;
            return (
              <a
                key={t.href}
                href={t.href}
                className={`px-2 py-0.5 text-[10px] rounded-full transition-all ${
                  active ? "bg-black text-white" : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {t.label}
              </a>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <a href="/auth" className="text-[10px] text-gray-700 hover:text-black">Log out</a>
        </div>
      </div>
    </div>
   );
 }
