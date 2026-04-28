"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  MinusCircle,
  Receipt,
} from "lucide-react";
import { formatCurrency, formatSignedCurrency, getMonthName } from "@/lib/utils";
import type { TransactionWithCategory } from "@/types";

interface HomeClientProps {
  transactions: TransactionWithCategory[];
  totalIncome: number;
  totalExpense: number;
  currency: string;
  currentMonth: number;
  currentYear: number;
}

export default function HomeClient({
  transactions,
  totalIncome,
  totalExpense,
  currency,
  currentMonth,
  currentYear,
}: HomeClientProps) {
  const router = useRouter();
  const month = currentMonth;
  const year = currentYear;
  const netBalance = totalIncome - totalExpense;

  const navigateMonth = (direction: "prev" | "next") => {
    let m = month;
    let y = year;
    if (direction === "prev") {
      m = month === 0 ? 11 : month - 1;
      y = month === 0 ? year - 1 : year;
    } else {
      m = month === 11 ? 0 : month + 1;
      y = month === 11 ? year + 1 : year;
    }
    router.push(`/?month=${m}&year=${y}`);
  };

  // Group transactions by date
  const groupedTransactions = transactions.reduce(
    (groups: Record<string, TransactionWithCategory[]>, txn) => {
      const dateKey = new Date(txn.date).toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      });
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(txn);
      return groups;
    },
    {}
  );

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-lg font-bold text-gray-900">Pocket Assistant</h1>
        </div>
      </header>

      {/* Month Navigator */}
      <div className="flex items-center justify-center gap-4 py-3 px-4">
        <button
          id="prev-month-btn"
          onClick={() => navigateMonth("prev")}
          className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft size={20} className="text-gray-600" />
        </button>
        <span className="text-base font-semibold text-gray-900 min-w-[140px] text-center">
          {getMonthName(month)} {year}
        </span>
        <button
          id="next-month-btn"
          onClick={() => navigateMonth("next")}
          className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ChevronRight size={20} className="text-gray-600" />
        </button>
      </div>

      {/* Balance Card */}
      <div className="px-4 mb-4">
        <div
          className="rounded-2xl p-6 text-white animate-scaleIn"
          style={{ background: "var(--gradient-card)" }}
        >
          <p className="text-sm font-medium text-white/80 text-center">
            Net Balance
          </p>
          <p className="text-3xl font-bold text-center mt-1 tracking-tight">
            {formatCurrency(netBalance, currency)}
          </p>
          <div className="flex justify-between mt-5 pt-4 border-t border-white/20">
            <div className="text-center flex-1">
              <p className="text-xs text-white/70 uppercase tracking-wide">
                Money In
              </p>
              <p className="text-sm font-semibold mt-0.5">
                {formatSignedCurrency(totalIncome, currency)}
              </p>
            </div>
            <div className="text-center flex-1">
              <p className="text-xs text-white/70 uppercase tracking-wide">
                Money Out
              </p>
              <p className="text-sm font-semibold mt-0.5">
                -{formatCurrency(totalExpense, currency)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 px-4 mb-6">
        <Link
          href="/transaction/new?type=INCOME"
          id="money-in-btn"
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-50 text-emerald-600 font-semibold text-sm hover:bg-emerald-100 transition-colors active:scale-[0.98]"
        >
          <PlusCircle size={18} />
          Money In
        </Link>
        <Link
          href="/transaction/new?type=EXPENSE"
          id="money-out-btn"
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-50 text-red-500 font-semibold text-sm hover:bg-red-100 transition-colors active:scale-[0.98]"
        >
          <MinusCircle size={18} />
          Money Out
        </Link>
      </div>

      {/* Recent Transactions */}
      <div className="px-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <h2 className="text-base font-semibold text-gray-900 px-4 pt-4 pb-2">
            Recent Transactions
          </h2>

          {transactions.length === 0 ? (
            <div className="flex flex-col items-center py-12 px-4">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                <Receipt size={28} className="text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">No transactions yet</p>
              <p className="text-gray-400 text-sm mt-1">
                Tap &apos;Money In&apos; or &apos;Money Out&apos; to add one
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {Object.entries(groupedTransactions).map(
                ([dateLabel, txns]) => (
                  <div key={dateLabel}>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide px-4 pt-3 pb-1">
                      {dateLabel}
                    </p>
                    {txns.map((txn, idx) => (
                      <Link
                        key={txn.id}
                        href={`/transaction/${txn.id}`}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors stagger-item cursor-pointer"
                        style={{ animationDelay: `${idx * 0.05}s` }}
                      >
                        {/* Category icon */}
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                          style={{
                            backgroundColor:
                              txn.category.color
                                ? `${txn.category.color}15`
                                : "#f3f4f6",
                          }}
                        >
                          {txn.category.icon || "📦"}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {txn.category.name}
                          </p>
                          {txn.description && (
                            <p className="text-xs text-gray-400 truncate">
                              {txn.description}
                            </p>
                          )}
                        </div>

                        {/* Amount */}
                        <p
                          className={`text-sm font-semibold ${
                            txn.type === "INCOME"
                              ? "text-emerald-500"
                              : "text-red-500"
                          }`}
                        >
                          {txn.type === "INCOME" ? "+" : "-"}
                          {formatCurrency(txn.amount, currency)}
                        </p>
                      </Link>
                    ))}
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
