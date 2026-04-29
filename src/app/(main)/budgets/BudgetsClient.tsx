"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Trash2,
  X,
  AlertTriangle,
  Check,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { createOrUpdateBudget, deleteBudget } from "./actions";

interface BudgetItem {
  id: string;
  limit: number;
  categoryId: string;
  category: {
    id: string;
    name: string;
    icon: string | null;
    color: string | null;
  };
}

interface CategoryItem {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
}

interface BudgetsClientProps {
  budgets: BudgetItem[];
  expenseCategories: CategoryItem[];
  spendingByCategory: Record<string, number>;
  totalBudget: number;
  totalSpent: number;
  currency: string;
  currentMonth: string;
  monthLabel: string;
}

export default function BudgetsClient({
  budgets,
  expenseCategories,
  spendingByCategory,
  totalBudget,
  totalSpent,
  currency,
  currentMonth,
  monthLabel,
}: BudgetsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showAdd, setShowAdd] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [limitAmount, setLimitAmount] = useState("");
  const [error, setError] = useState("");

  // All expense categories available for budgeting (existing budgets can be updated)
  const budgetByCategoryId = new Map(budgets.map((b) => [b.categoryId, b]));

  const totalPct = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const isOverBudget = totalPct > 100;

  const handleAdd = () => {
    if (!selectedCategoryId) {
      setError("Please select a category");
      return;
    }
    if (!limitAmount || parseFloat(limitAmount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }
    setError("");

    startTransition(async () => {
      const result = await createOrUpdateBudget({
        categoryId: selectedCategoryId,
        limit: parseFloat(limitAmount),
        month: currentMonth,
      });
      if (result.error) {
        setError(result.error);
      } else {
        setShowAdd(false);
        setSelectedCategoryId("");
        setLimitAmount("");
        router.refresh();
      }
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteBudget(id);
      router.refresh();
    });
  };

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => router.back()}
            className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={22} className="text-gray-700" />
          </button>
          <div className="text-center">
            <h1 className="text-lg font-bold text-gray-900">Budgets</h1>
            <p className="text-xs text-gray-400">{monthLabel}</p>
          </div>
          <button
            onClick={() => {
              setShowAdd(true);
              setError("");
            }}
            className="p-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 transition-colors"
          >
            <Plus size={20} className="text-emerald-600" />
          </button>
        </div>
      </header>

      <div className="px-4 pt-4 pb-8">
        {/* Overall Budget Summary */}
        {budgets.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-900">
                Total Budget
              </p>
              <p
                className={`text-sm font-bold ${
                  isOverBudget ? "text-red-500" : "text-emerald-500"
                }`}
              >
                {formatCurrency(totalSpent, currency)} /{" "}
                {formatCurrency(totalBudget, currency)}
              </p>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${
                  isOverBudget
                    ? "bg-gradient-to-r from-red-400 to-red-500"
                    : totalPct > 80
                    ? "bg-gradient-to-r from-amber-400 to-amber-500"
                    : "bg-gradient-to-r from-emerald-400 to-emerald-500"
                }`}
                style={{ width: `${Math.min(totalPct, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              {isOverBudget ? (
                <span className="text-red-500 flex items-center gap-1">
                  <AlertTriangle size={12} />
                  Over budget by{" "}
                  {formatCurrency(totalSpent - totalBudget, currency)}
                </span>
              ) : (
                <>
                  {formatCurrency(totalBudget - totalSpent, currency)} remaining
                </>
              )}
            </p>
          </div>
        )}

        {/* Budget List */}
        {budgets.length === 0 ? (
          <div className="flex flex-col items-center py-16 px-4">
            <div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center mb-4">
              <span className="text-2xl">💰</span>
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              No budgets yet
            </h2>
            <p className="text-gray-400 text-sm mt-2 text-center max-w-xs">
              Set spending limits for your expense categories to track where
              your money goes.
            </p>
            <button
              onClick={() => setShowAdd(true)}
              className="mt-4 px-5 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-colors active:scale-[0.98]"
            >
              Create First Budget
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {budgets.map((budget) => {
              const spent = spendingByCategory[budget.categoryId] || 0;
              const pct = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;
              const over = pct > 100;
              const warning = pct > 80 && !over;

              return (
                <div
                  key={budget.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover-lift"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                      style={{
                        backgroundColor: budget.category.color
                          ? `${budget.category.color}15`
                          : "#f3f4f6",
                      }}
                    >
                      {budget.category.icon || "📦"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">
                        {budget.category.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatCurrency(spent, currency)} of{" "}
                        {formatCurrency(budget.limit, currency)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {over && (
                        <AlertTriangle
                          size={16}
                          className="text-red-500 animate-pulse"
                        />
                      )}
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          over
                            ? "bg-red-50 text-red-500"
                            : warning
                            ? "bg-amber-50 text-amber-600"
                            : "bg-emerald-50 text-emerald-600"
                        }`}
                      >
                        {Math.round(pct)}%
                      </span>
                      <button
                        onClick={() => handleDelete(budget.id)}
                        disabled={isPending}
                        className="p-1 rounded-full hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={14} className="text-gray-300" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out`}
                      style={{
                        width: `${Math.min(pct, 100)}%`,
                        backgroundColor: over
                          ? "#EF4444"
                          : warning
                          ? "#F59E0B"
                          : budget.category.color || "#10B981",
                      }}
                    />
                  </div>

                  {over && (
                    <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                      <AlertTriangle size={11} />
                      Over by {formatCurrency(spent - budget.limit, currency)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Budget Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 animate-fadeIn">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md p-6 animate-slideUp shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">
                Set Budget
              </h3>
              <button
                onClick={() => setShowAdd(false)}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100 mb-4 animate-shake">
                {error}
              </div>
            )}

            {/* Category Selector */}
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Category
            </p>
            {expenseCategories.length === 0 ? (
              <p className="text-sm text-gray-400 mb-4">
                No expense categories found. Add categories first.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2 mb-4 max-h-48 overflow-y-auto">
                {expenseCategories.map((cat) => {
                  const existingBudget = budgetByCategoryId.get(cat.id);
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategoryId(cat.id);
                        if (existingBudget) {
                          setLimitAmount(String(existingBudget.limit));
                        }
                      }}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all relative ${
                        selectedCategoryId === cat.id
                          ? "bg-emerald-50 border-2 border-emerald-400"
                          : "border-gray-100 hover:bg-gray-50"
                      }`}
                    >
                      <span
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-base"
                        style={{
                          backgroundColor: cat.color
                            ? `${cat.color}15`
                            : "#f3f4f6",
                        }}
                      >
                        {cat.icon || "📦"}
                      </span>
                      <span className="text-[10px] font-medium text-gray-600 text-center leading-tight">
                        {cat.name}
                      </span>
                      {existingBudget && (
                        <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Limit Amount */}
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Monthly Limit
            </p>
            <div className="flex items-center gap-2 mb-5">
              <span className="text-lg font-bold text-gray-400">৳</span>
              <input
                type="number"
                inputMode="decimal"
                value={limitAmount}
                onChange={(e) => setLimitAmount(e.target.value)}
                placeholder="5,000"
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-lg font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
              />
            </div>

            <button
              onClick={handleAdd}
              disabled={isPending || !selectedCategoryId || !limitAmount}
              className="w-full py-3 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-50 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {isPending ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </span>
              ) : (
                <>
                  <Check size={18} />
                  Set Budget
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
