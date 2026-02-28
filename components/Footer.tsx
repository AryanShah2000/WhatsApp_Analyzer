import Link from "next/link";
import { MessageSquareText } from "lucide-react";

const FOOTER_LINKS = {
  Product: [
    { href: "/analyze", label: "Analyze Chat" },
    { href: "/insights", label: "AI Insights" },
  ],
  Resources: [
    { href: "/#how-it-works", label: "How It Works" },
    { href: "/#features", label: "Features" },
  ],
};

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-900 font-semibold text-lg mb-3"
            >
              <MessageSquareText className="w-5 h-5 text-[#25D366]" />
              WhatsApp Chat Analyzer
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
              Free, private analytics for your WhatsApp conversations. Your data
              never leaves your browser.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
            <div key={heading}>
              <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                {heading}
              </h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-500 hover:text-[#25D366] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} WhatsApp Chat Analyzer. All rights
            reserved.
          </p>
          <p className="text-xs text-gray-400">
            Built with Next.js · Deployed on Vercel
          </p>
        </div>
      </div>
    </footer>
  );
}
