import { Facebook, Twitter, Youtube } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();
  const hostname =
    typeof window !== "undefined" ? window.location.hostname : "";
  const caffeineUrl = `https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(hostname)}`;

  return (
    <footer className="bg-navy text-white pt-10 pb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-gold font-display font-bold text-lg mb-3">
              MKJC Exam Portal
            </h3>
            <p className="text-white/70 text-sm max-w-xs">
              Empowering students through scholarship examinations. Register,
              take your exam, and check results all in one place.
            </p>
            <div className="flex gap-3 mt-4">
              <span
                aria-label="Facebook"
                className="text-white/60 cursor-pointer hover:text-gold transition-smooth"
              >
                <Facebook className="h-5 w-5" />
              </span>
              <span
                aria-label="Twitter"
                className="text-white/60 cursor-pointer hover:text-gold transition-smooth"
              >
                <Twitter className="h-5 w-5" />
              </span>
              <span
                aria-label="YouTube"
                className="text-white/60 cursor-pointer hover:text-gold transition-smooth"
              >
                <Youtube className="h-5 w-5" />
              </span>
            </div>
          </div>
          <div>
            <h4 className="text-white/90 font-semibold mb-3 text-sm uppercase tracking-wider">
              Quick Links
            </h4>
            <ul className="space-y-2 text-sm text-white/70">
              <li>
                <span className="hover:text-gold transition-smooth cursor-pointer">
                  Home
                </span>
              </li>
              <li>
                <span className="hover:text-gold transition-smooth cursor-pointer">
                  Register
                </span>
              </li>
              <li>
                <span className="hover:text-gold transition-smooth cursor-pointer">
                  Take Exam
                </span>
              </li>
              <li>
                <span className="hover:text-gold transition-smooth cursor-pointer">
                  Results
                </span>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 pt-5 text-center text-sm text-white/50">
          © {year}. Built with ❤️ using{" "}
          <a
            href={caffeineUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold hover:underline"
          >
            caffeine.ai
          </a>
        </div>
      </div>
    </footer>
  );
}
