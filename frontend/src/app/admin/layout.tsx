import type { Metadata } from 'next';
import { Shield, Gavel, Users, BarChart3 } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Admin Dashboard - VETTED',
  description: 'VETTED Admin Control Panel',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#07090E]">
      {/* Admin Header */}
      <header className="bg-[#0F131E] border-b border-[#1E2538]">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-[#10B981]" />
              <div>
                <h1 className="text-xl font-black text-white">VETTED Admin</h1>
                <p className="text-xs text-gray-400">Control Panel</p>
              </div>
            </div>
            
            <nav className="flex items-center gap-2">
              <Link
                href="/admin/disputes"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-gray-300 hover:text-white hover:bg-[#161C2C] transition"
              >
                <Gavel className="w-4 h-4" />
                <span className="hidden md:inline">Disputes</span>
              </Link>
              <Link
                href="/admin/users"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-gray-300 hover:text-white hover:bg-[#161C2C] transition"
              >
                <Users className="w-4 h-4" />
                <span className="hidden md:inline">Users</span>
              </Link>
              <Link
                href="/admin/analytics"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-gray-300 hover:text-white hover:bg-[#161C2C] transition"
              >
                <BarChart3 className="w-4 h-4" />
                <span className="hidden md:inline">Analytics</span>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Admin Content */}
      <main>
        {children}
      </main>

      {/* Admin Footer */}
      <footer className="bg-[#0F131E] border-t border-[#1E2538] mt-12">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 text-center">
          <p className="text-xs text-gray-500">
            VETTED Admin Control Panel • {new Date().getFullYear()} • All actions are logged in the immutable audit trail
          </p>
        </div>
      </footer>
    </div>
  );
}
