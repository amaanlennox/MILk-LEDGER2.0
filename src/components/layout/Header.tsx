
"use client";

import Link from "next/link";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useAppContext } from "@/context/AppContext";

export function Header() {
  const { t } = useAppContext();
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-500/10 group-hover:scale-105 transition-transform duration-200">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
              <path d="M11 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v3" />
              <path d="M12 11h.01" />
              <path d="M16 11h.01" />
              <path d="M20 11h.01" />
              <path d="M12 15h.01" />
              <path d="M16 15h.01" />
              <path d="M20 15h.01" />
              <path d="M22 13h-4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4" />
              <path d="M18 17a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
              <circle cx="18" cy="15" r="3" stroke="currentColor" fill="none" />
              <path d="M15 15c0-1.5 1-2.5 3-2.5s3 1 3 2.5" />
              <circle cx="12" cy="13" r="1" fill="currentColor"/>
            </svg>
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400">
            {t('appName')}
          </span>
        </Link>
        <div className="flex items-center gap-1.5">
          <LanguageToggle />
        </div>
      </div>
    </header>
  );
}
