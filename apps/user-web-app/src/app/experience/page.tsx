 'use client';
 
 import Link from "next/link";
 import { SiteHeader } from "@/components/SiteHeader";
 import { FooterBrand } from "@/components/FooterBrand";
 
 export default function ExperiencePage() {
   return (
     <div className="min-h-screen bg-[#05020A] text-white flex flex-col">
       <SiteHeader />
       <main className="flex-1 bg-white pt-24 md:pt-28">
         <section className="max-w-6xl mx-auto px-6 md:px-12 py-16 md:py-20">
           <div className="max-w-2xl">
             <p className="text-[11px] uppercase tracking-[0.24em] text-black/60 mb-3">Experience</p>
             <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4 text-black">
               PayParq experience.
             </h1>
             <p className="text-sm md:text-base text-black/75 mb-6">
               Explore how PayParq digitizes parking access, payments, and enforcement across portfolios.
             </p>
             <div className="flex items-center gap-3">
               <Link
                 href="/vision"
                 className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-black text-white text-xs font-semibold shadow-md hover:bg-black/90 transition-colors"
               >
                 View Vision
               </Link>
               <Link
                 href="/product"
                 className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-black/15 text-black text-xs font-semibold hover:bg-black/5 transition-colors"
               >
                 Product &amp; Pricing
               </Link>
             </div>
           </div>
         </section>
       </main>
       <footer className="border-t border-white/10 bg-[#05020A] font-apple-ui">
         <div className="max-w-6xl mx-auto px-6 py-16 md:py-20">
           <FooterBrand />
         </div>
       </footer>
     </div>
   );
 }
