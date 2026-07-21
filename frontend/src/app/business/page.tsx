import { Shield, Lock, TrendingDown, CheckCircle } from "lucide-react";

export default function BusinessPortalPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero */}
      <div className="max-w-4xl mx-auto text-center space-y-6 mb-16">
        <h1 className="text-5xl font-bold">
          Hire Elite Nigerian Talent with <span className="text-green-600">Zero Risk</span>
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400">
          Biometric-verified developers, automated escrow, and 50%+ cost savings. 
          Every engineer is triple-verified before you see them.
        </p>
        <div className="flex gap-4 justify-center">
          <button className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold text-lg">
            View Talent Pool
          </button>
          <button className="px-8 py-3 border-2 border-green-600 text-green-600 rounded-lg hover:bg-green-50 dark:hover:bg-green-950 transition font-semibold text-lg">
            Book Demo
          </button>
        </div>
      </div>

      {/* Value Props */}
      <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8 mb-20">
        <div className="bg-white dark:bg-slate-900 border rounded-xl p-8">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950 rounded-lg flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold mb-2">Zero Identity Fraud</h3>
          <p className="text-slate-600 dark:text-slate-400">
            Biometric liveness checks, NIN/BVN verification, and sandboxed code 
            assessments. No fake resumes, no deepfakes.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border rounded-xl p-8">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-950 rounded-lg flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-xl font-bold mb-2">Zero Capital Risk</h3>
          <p className="text-slate-600 dark:text-slate-400">
            Non-custodial Airwallex escrow. Funds release only when biometric 
            handshake confirms milestone completion.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border rounded-xl p-8">
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-950 rounded-lg flex items-center justify-center mb-4">
            <TrendingDown className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="text-xl font-bold mb-2">50%+ Cost Savings</h3>
          <p className="text-slate-600 dark:text-slate-400">
            Senior engineers at $45-65/hr vs. $150-200/hr US rates. Same quality, 
            massive savings.
          </p>
        </div>
      </div>

      {/* How It Works */}
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">How VettedPay Works</h2>
        
        <div className="space-y-6">
          <div className="flex gap-6">
            <div className="flex-shrink-0 w-12 h-12 bg-green-100 dark:bg-green-950 rounded-full flex items-center justify-center text-green-600 font-bold text-lg">
              1
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Browse Pre-Verified Talent</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Every developer has passed all three verification tiers. View their 
                VettedME passports, trust scores, and portfolios.
              </p>
            </div>
          </div>

          <div className="flex gap-6">
            <div className="flex-shrink-0 w-12 h-12 bg-green-100 dark:bg-green-950 rounded-full flex items-center justify-center text-green-600 font-bold text-lg">
              2
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Create Milestone Contract</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Define deliverables and timelines. We set up your Airwallex escrow 
                wallet automatically.
              </p>
            </div>
          </div>

          <div className="flex gap-6">
            <div className="flex-shrink-0 w-12 h-12 bg-green-100 dark:bg-green-950 rounded-full flex items-center justify-center text-green-600 font-bold text-lg">
              3
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Deposit Funds (Buyer-Owned)</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Transfer via ACH/Wire. Funds stay in YOUR Airwallex account, 
                managed by VettedPay protocol. We never hold your money.
              </p>
            </div>
          </div>

          <div className="flex gap-6">
            <div className="flex-shrink-0 w-12 h-12 bg-green-100 dark:bg-green-950 rounded-full flex items-center justify-center text-green-600 font-bold text-lg">
              4
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Developer Delivers Work</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Review deliverables. Approve milestone. Developer completes 
                biometric handshake.
              </p>
            </div>
          </div>

          <div className="flex gap-6">
            <div className="flex-shrink-0 w-12 h-12 bg-green-100 dark:bg-green-950 rounded-full flex items-center justify-center text-green-600 font-bold text-lg">
              5
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Automatic Payment Release</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Funds released instantly to developer's Nigerian bank account. 
                Optimized FX rates. W-8BEN auto-generated.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-4xl mx-auto mt-20 bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 border rounded-2xl p-12 text-center">
        <h2 className="text-3xl font-bold mb-4">
          Ready to Access Elite Nigerian Developers?
        </h2>
        <p className="text-xl text-slate-600 dark:text-slate-400 mb-8">
          20 pre-verified developers ready to deploy this month.
        </p>
        <button className="px-12 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold text-lg">
          View Available Talent
        </button>
      </div>
    </div>
  );
}
