import { GraduationCap, Menu, X } from "lucide-react";
import { useState } from "react";
import type { Lang, Page } from "../App";

interface NavbarProps {
  page: Page;
  setPage: (p: Page) => void;
  lang: Lang;
  setLang: (l: Lang) => void;
}

const navLinks: { label: string; labelTa: string; page: Page }[] = [
  { label: "Home", labelTa: "முகப்பு", page: "home" },

  { label: "Take Exam", labelTa: "தேர்வு", page: "exam" },
  { label: "Results", labelTa: "முடிவு", page: "results" },
  { label: "Admin", labelTa: "நிர்வாகி", page: "admin" },
];

export default function Navbar({ page, setPage, lang, setLang }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b-2 border-gold shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            type="button"
            data-ocid="nav.home.link"
            onClick={() => setPage("home")}
            className="flex items-center gap-2 focus:outline-none"
          >
            <GraduationCap className="h-7 w-7 text-navy" />
            <span className="font-display font-bold text-xl">
              <span className="text-navy">MKJC</span>
              <span className="text-gold"> Portal</span>
            </span>
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <button
                type="button"
                key={link.page}
                data-ocid={`nav.${link.page}.link`}
                onClick={() => setPage(link.page)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  page === link.page
                    ? "text-gold font-semibold"
                    : "text-foreground hover:text-navy"
                }`}
              >
                {lang === "en" ? link.label : link.labelTa}
              </button>
            ))}

            {/* Language toggle */}
            <div className="ml-4 flex items-center border border-navy rounded-full overflow-hidden text-sm font-semibold">
              <button
                type="button"
                data-ocid="nav.lang.en.toggle"
                onClick={() => setLang("en")}
                className={`px-3 py-1 transition-colors ${
                  lang === "en"
                    ? "bg-navy text-white"
                    : "text-navy hover:bg-background"
                }`}
              >
                EN
              </button>
              <button
                type="button"
                data-ocid="nav.lang.ta.toggle"
                onClick={() => setLang("ta")}
                className={`px-3 py-1 transition-colors ${
                  lang === "ta"
                    ? "bg-navy text-white"
                    : "text-navy hover:bg-background"
                }`}
              >
                தமிழ்
              </button>
            </div>
          </nav>

          {/* Mobile menu button */}
          <button
            type="button"
            className="md:hidden p-2 text-navy"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-border px-4 py-3 space-y-1">
          {navLinks.map((link) => (
            <button
              type="button"
              key={link.page}
              data-ocid={`nav.mobile.${link.page}.link`}
              onClick={() => {
                setPage(link.page);
                setMobileOpen(false);
              }}
              className={`block w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                page === link.page
                  ? "text-gold font-semibold"
                  : "text-foreground"
              }`}
            >
              {lang === "en" ? link.label : link.labelTa}
            </button>
          ))}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setLang("en")}
              className={`px-3 py-1 rounded-full text-sm font-semibold border border-navy ${
                lang === "en" ? "bg-navy text-white" : "text-navy"
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLang("ta")}
              className={`px-3 py-1 rounded-full text-sm font-semibold border border-navy ${
                lang === "ta" ? "bg-navy text-white" : "text-navy"
              }`}
            >
              தமிழ்
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
