"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, X, SlidersHorizontal } from "lucide-react";
import { formatCurrency, formatRelativeDate } from "@/lib/utils";
import type { TransactionWithCategory } from "@/types";

interface CategoryOption {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
}
interface AccountOption {
  id: string;
  name: string;
}
interface TagOption {
  id: string;
  name: string;
  color: string | null;
}

interface Filters {
  q: string;
  type: string;
  categoryId: string;
  accountId: string;
  tagId: string;
  from: string;
  to: string;
}

interface Props {
  transactions: TransactionWithCategory[];
  categories: CategoryOption[];
  accounts: AccountOption[];
  tags: TagOption[];
  currency: string;
  totalIncome: number;
  totalExpense: number;
  resultLimit: number;
  reachedLimit: boolean;
  filters: Filters;
}

export default function TransactionsClient({
  transactions,
  categories,
  accounts,
  tags,
  currency,
  totalIncome,
  totalExpense,
  resultLimit,
  reachedLimit,
  filters,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [text, setText] = useState(filters.q);
  const [showFilters, setShowFilters] = useState(
    Boolean(filters.type || filters.categoryId || filters.accountId || filters.tagId || filters.from || filters.to)
  );

  // Push a new query string to re-run the server query.
  const apply = (next: Partial<Filters>) => {
    const merged = { ...filters, ...next };
    const params = new URLSearchParams();
    if (merged.q) params.set("q", merged.q);
    if (merged.type) params.set("type", merged.type);
    if (merged.categoryId) params.set("categoryId", merged.categoryId);
    if (merged.accountId) params.set("accountId", merged.accountId);
    if (merged.tagId) params.set("tagId", merged.tagId);
    if (merged.from) params.set("from", merged.from);
    if (merged.to) params.set("to", merged.to);
    const qs = params.toString();
    startTransition(() => router.push(qs ? `/transactions?${qs}` : "/transactions"));
  };

  // Debounce the free-text search.
  useEffect(() => {
    if (text === filters.q) return;
    const t = setTimeout(() => apply({ q: text }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  const hasActiveFilters =
    Boolean(filters.q || filters.type || filters.categoryId || filters.accountId || filters.tagId || filters.from || filters.to);

  const clearAll = () => {
    setText("");
    startTransition(() => router.push("/transactions"));
  };

  const inputCls =
    "w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent";

  return (
    <div className="animate-fadeIn pb-8">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-lg border-b border-gray-100">
        <div className="flex items-center gap-2 px-4 py-3">
          <Link href="/" className="p-1.5 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft size={22} className="text-gray-700" />
          </Link>
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Search description or category"
              className="w-full pl-9 pr-9 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
            />
            {text && (
              <button
                onClick={() => setText("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-gray-200"
              >
                <X size={14} className="text-gray-400" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters((s) => !s)}
            className={`p-2 rounded-xl border transition-colors ${
              showFilters || hasActiveFilters
                ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                : "bg-gray-50 border-gray-200 text-gray-500"
            }`}
          >
            <SlidersHorizontal size={18} />
          </button>
        </div>

        {/* Filter controls */}
        {showFilters && (
          <div className="px-4 pb-3 space-y-2 animate-slideDown">
            {/* Type */}
            <div className="flex gap-1.5">
              {([
                ["", "All"],
                ["INCOME", "Income"],
                ["EXPENSE", "Expense"],
                ["TRANSFER", "Transfer"],
              ] as const).map(([val, label]) => (
                <button
                  key={label}
                  onClick={() => apply({ type: val })}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    filters.type === val
                      ? "bg-emerald-50 text-emerald-600 border-emerald-300"
                      : "bg-gray-50 text-gray-500 border-gray-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <select
                value={filters.categoryId}
                onChange={(e) => apply({ categoryId: e.target.value })}
                className={inputCls}
              >
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <select
                value={filters.accountId}
                onChange={(e) => apply({ accountId: e.target.value })}
                className={inputCls}
              >
                <option value="">All accounts</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            {tags.length > 0 && (
              <select
                value={filters.tagId}
                onChange={(e) => apply({ tagId: e.target.value })}
                className={inputCls}
              >
                <option value="">All tags</option>
                {tags.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-gray-400 uppercase tracking-wide mb-1">From</label>
                <input
                  type="date"
                  value={filters.from}
                  onChange={(e) => apply({ from: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 uppercase tracking-wide mb-1">To</label>
                <input
                  type="date"
                  value={filters.to}
                  onChange={(e) => apply({ to: e.target.value })}
                  className={inputCls}
                />
              </div>
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearAll}
                className="w-full py-1.5 rounded-lg text-xs font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </header>

      {/* Result summary */}
      <div className="px-4 pt-3 pb-1 flex items-center justify-between text-xs">
        <span className="text-gray-400">
          {transactions.length}
          {reachedLimit ? `+ (showing first ${resultLimit})` : ""} result
          {transactions.length !== 1 ? "s" : ""}
          {isPending ? " …" : ""}
        </span>
        <span className="flex gap-3">
          <span className="text-emerald-600 font-medium">
            +{formatCurrency(totalIncome, currency)}
          </span>
          <span className="text-red-500 font-medium">
            -{formatCurrency(totalExpense, currency)}
          </span>
        </span>
      </div>

      {/* Results */}
      <div className="px-4 pt-2">
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <Search size={26} className="text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No matching transactions</p>
            <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
            {transactions.map((txn) => {
              const isTransfer = txn.type === "TRANSFER";
              const color = isTransfer ? "#3B82F6" : txn.category?.color || "#6B7280";
              return (
                <Link
                  key={txn.id}
                  href={`/transaction/${txn.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                    style={{ backgroundColor: `${color}15` }}
                  >
                    {isTransfer ? "⇌" : txn.category?.icon || "📦"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {isTransfer ? "Transfer" : txn.category?.name || "Transaction"}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {[
                        formatRelativeDate(new Date(txn.date)),
                        txn.account?.name,
                        txn.description,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    {txn.tags && txn.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {txn.tags.map(({ tag }) => {
                          const c = tag.color || "#64748B";
                          return (
                            <span
                              key={tag.id}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium"
                              style={{ backgroundColor: `${c}15`, color: c }}
                            >
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c }} />
                              {tag.name}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <p
                    className={`text-sm font-semibold ${
                      txn.type === "INCOME"
                        ? "text-emerald-500"
                        : txn.type === "TRANSFER"
                          ? "text-blue-500"
                          : "text-red-500"
                    }`}
                  >
                    {txn.type === "INCOME" ? "+" : txn.type === "TRANSFER" ? "" : "-"}
                    {formatCurrency(txn.amount, currency)}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
