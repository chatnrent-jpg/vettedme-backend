import { Shield, Code, Video, CheckCircle } from "lucide-react";

export default function TalentPortalPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      {/* Welcome Hero */}
      <div className="max-w-4xl mx-auto text-center space-y-6 mb-16">
        <h1 className="text-5xl font-bold">
          Get Your <span className="text-blue-600">VettedME Passport</span>
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400">
          Complete three verification tiers and unlock access to high-value 
          contracts with Western enterprises. Zero fraud, maximum trust.
        </p>
      </div>

      {/* Three-Tier Assessment Flow */}
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Tier 1 */}
        <div className="bg-white dark:bg-slate-900 border rounded-xl p-8 hover:shadow-lg transition">
          <div className="flex items-start gap-6">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950 rounded-lg flex items-center justify-center flex-shrink-0">
              <Code className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-2xl font-bold">Tier 1: Portfolio Audit</h3>
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-950 text-blue-600 text-sm font-semibold rounded-full">
                  70%+ to pass
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Connect your GitHub account. Our AI audits your commit history, 
                code complexity, and authorship to detect AI-generated or copy-pasted 
                portfolios.
              </p>
              <div className="flex gap-3">
                <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold">
                  Start Portfolio Audit
                </button>
                <button className="px-6 py-2 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                  Learn More
                </button>
              </div>
            </div>
            <div className="text-slate-300 dark:text-slate-700">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Tier 2 */}
        <div className="bg-white dark:bg-slate-900 border rounded-xl p-8 opacity-60">
          <div className="flex items-start gap-6">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-950 rounded-lg flex items-center justify-center flex-shrink-0">
              <Code className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-2xl font-bold">Tier 2: Sandboxed Code Lab</h3>
                <span className="px-3 py-1 bg-green-100 dark:bg-green-950 text-green-600 text-sm font-semibold rounded-full">
                  85%+ to pass
                </span>
                <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold rounded-full">
                  Locked
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Complete a live coding challenge in our secure sandbox. Debug broken 
                code, pass test suites, and prove your skills can't be outsourced.
              </p>
            </div>
            <div className="text-slate-300 dark:text-slate-700">
              <div className="w-6 h-6 border-2 border-slate-300 dark:border-slate-700 rounded-full" />
            </div>
          </div>
        </div>

        {/* Tier 3 */}
        <div className="bg-white dark:bg-slate-900 border rounded-xl p-8 opacity-60">
          <div className="flex items-start gap-6">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-950 rounded-lg flex items-center justify-center flex-shrink-0">
              <Video className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-2xl font-bold">Tier 3: AI Technical Viva</h3>
                <span className="px-3 py-1 bg-purple-100 dark:bg-purple-950 text-purple-600 text-sm font-semibold rounded-full">
                  90%+ to pass
                </span>
                <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold rounded-full">
                  Locked
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                10-minute video interview explaining your code. Our AI verifies your 
                identity with biometric tracking and detects third-party assistance.
              </p>
            </div>
            <div className="text-slate-300 dark:text-slate-700">
              <div className="w-6 h-6 border-2 border-slate-300 dark:border-slate-700 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Why Get Verified */}
      <div className="max-w-4xl mx-auto mt-20">
        <h2 className="text-3xl font-bold text-center mb-8">
          Why Get Your VettedME Passport?
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-950 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="font-bold mb-2">Un-Fakeable Credential</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Three-tier verification that cannot be bought, faked, or outsourced
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-950 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="font-bold mb-2">High-Value Contracts</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Access $5k-$50k B2B projects with Western tech companies
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-950 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="font-bold mb-2">Trust Score</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Public passport showing your verified skills and biometric proof
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
