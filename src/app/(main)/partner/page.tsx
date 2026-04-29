import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Partner Mode - Pocket Assistant",
  description: "Share expenses with your partner",
};

export default function PartnerModePage() {
  return (
    <div className="animate-fadeIn">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="px-4 py-3">
          <h1 className="text-lg font-bold text-gray-900 text-center">
            Partner Mode
          </h1>
        </div>
      </header>
      <div className="px-4 pt-8 pb-8 flex flex-col items-center justify-center min-h-[50vh] text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 text-2xl">
          💑
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Partner Mode Coming Soon</h2>
        <p className="text-gray-500 mb-6 max-w-sm">
          Link your account with your partner's to track shared expenses, budgets, and financial goals together.
        </p>
        <button className="bg-emerald-500 text-white px-6 py-3 rounded-xl font-medium shadow-sm shadow-emerald-200">
          Invite Partner
        </button>
      </div>
    </div>
  );
}
