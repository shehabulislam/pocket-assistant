import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Recurring Transactions - Pocket Assistant",
  description: "Auto-log rent, subscriptions, salary.",
};

export default function RecurringTransactionsPage() {
  return (
    <div className="animate-fadeIn">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="px-4 py-3">
          <h1 className="text-lg font-bold text-gray-900 text-center">
            Recurring Transactions
          </h1>
        </div>
      </header>
      <div className="px-4 pt-8 pb-8 flex flex-col items-center justify-center min-h-[50vh] text-center">
        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4 text-2xl">
          🔁
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Recurring Transactions</h2>
        <p className="text-gray-500 mb-6 max-w-sm">
          Set up automatic logs for your recurring income and expenses so you never miss a beat.
        </p>
        <button className="bg-purple-500 text-white px-6 py-3 rounded-xl font-medium shadow-sm shadow-purple-200">
          Add Recurring Transaction
        </button>
      </div>
    </div>
  );
}
