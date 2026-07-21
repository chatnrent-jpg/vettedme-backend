import Link from "next/link";
import { Briefcase, Users, DollarSign, Settings } from "lucide-react";

export default function BusinessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="border-b bg-white dark:bg-slate-900">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-green-600" />
              <span className="text-xl font-bold">VettedPay</span>
            </Link>
            
            <nav className="flex gap-6 items-center">
              <Link 
                href="/business/dashboard" 
                className="text-sm hover:text-green-600 transition"
              >
                Dashboard
              </Link>
              <Link 
                href="/business/talent" 
                className="text-sm hover:text-green-600 transition"
              >
                Talent Pool
              </Link>
              <Link 
                href="/business/contracts" 
                className="text-sm hover:text-green-600 transition"
              >
                Contracts
              </Link>
              <Link 
                href="/business/escrow" 
                className="text-sm hover:text-green-600 transition"
              >
                Escrow
              </Link>
              <div className="w-8 h-8 bg-green-100 dark:bg-green-950 rounded-full flex items-center justify-center">
                <Settings className="w-4 h-4 text-green-600" />
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="border-t bg-white dark:bg-slate-900 mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-sm text-slate-600 dark:text-slate-400">
            © 2026 VETTED. Secure milestone payments for offshore tech talent.
          </div>
        </div>
      </footer>
    </div>
  );
}
