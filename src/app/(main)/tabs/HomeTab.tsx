"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  MinusCircle,
  Receipt,
  Target,
  Calendar,
  Check,
  X,
  RefreshCw,
  Bell,
} from "lucide-react";
import { formatCurrency, formatSignedCurrency, getMonthName } from "@/lib/utils";
import { createTransaction } from "../transaction/actions";
import type { TransactionWithCategory } from "@/types";

interface GoalItem {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string | null;
}

interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  type: string;
}

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
}

interface HomeTabProps {
  transactions: TransactionWithCategory[];
  totalIncome: number;
  totalExpense: number;
  currency: string;
  currentMonth: number;
  currentYear: number;
  goals: GoalItem[];
  incomeCategories: Category[];
  expenseCategories: Category[];
  accounts: Account[];
  budgets: { id: string; limit: number; categoryId: string; category: { id: string; name: string; icon: string | null; color: string | null } }[];
  spendingByCategory: Record<string, number>;
  totalBudget: number;
  totalSpent: number;
  currentBudgetMonth: string;
  budgetMonthLabel: string;
  hasTransactionsToday: boolean;
  dailyReminder: boolean;
}

export default function HomeTab({
  transactions,
  totalIncome,
  totalExpense,
  currency,
  currentMonth,
  currentYear,
  goals,
  incomeCategories,
  expenseCategories,
  accounts,
  budgets,
  spendingByCategory,
  totalBudget,
  totalSpent,
  currentBudgetMonth,
  budgetMonthLabel,
  hasTransactionsToday,
  dailyReminder,
}: HomeTabProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const month = currentMonth;
  const year = currentYear;
  const totalAccountBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  const netBalance = totalIncome - totalExpense;

  // Reminder dismiss state
  const [reminderDismissed, setReminderDismissed] = useState(false);
  const showReminder = dailyReminder && !hasTransactionsToday && !reminderDismissed;

  // Transaction modal state
  const [showModal, setShowModal] = useState<"INCOME" | "EXPENSE" | null>(null);
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState(accounts[0]?.id || "");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [error, setError] = useState("");
  const [showCategories, setShowCategories] = useState(false);

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

  // Modal helpers
  const isIncome = showModal === "INCOME";
  const accentColor = isIncome ? "#10B981" : "#EF4444";
  const accentBg = isIncome ? "bg-emerald-50" : "bg-red-50";
  const accentText = isIncome ? "text-emerald-600" : "text-red-500";
  const modalCategories = isIncome ? incomeCategories : expenseCategories;
  const selectedCategory = modalCategories.find((c) => c.id === categoryId);

  const openModal = (type: "INCOME" | "EXPENSE") => {
    setShowModal(type);
    setAmount("");
    setCategoryId("");
    setAccountId(accounts[0]?.id || "");
    setDescription("");
    setDate(new Date().toISOString().split("T")[0]);
    setError("");
    setShowCategories(false);
  };

  const handleSubmit = () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }
    if (!categoryId) {
      setError("Please select a category");
      return;
    }
    if (!accountId) {
      setError("Please select an account");
      return;
    }
    setError("");

    startTransition(async () => {
      const result = await createTransaction({
        amount: parseFloat(amount),
        type: showModal!,
        categoryId,
        accountId,
        description: description || undefined,
        date,
      });
      if (result.error) {
        setError(result.error);
      } else {
        setShowModal(null);
        router.refresh();
      }
    });
  };

  // Goals summary
  const activeGoals = goals.filter((g) => g.currentAmount < g.targetAmount);
  const totalGoalsSaved = goals.reduce((s, g) => s + g.currentAmount, 0);
  const totalGoalsTarget = goals.reduce((s, g) => s + g.targetAmount, 0);

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-lg font-bold text-gray-900">Pocket Assistant</h1>
          <button
            onClick={() => {
              setIsRefreshing(true);
              router.refresh();
              // Stop spinning after a delay (refresh is async, no callback)
              setTimeout(() => setIsRefreshing(false), 2000);
            }}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors active:scale-95"
            id="refresh-btn"
            disabled={isRefreshing}
          >
            <RefreshCw
              size={18}
              className={`text-gray-500 transition-transform ${isRefreshing ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </header>

      {/* Daily Reminder Banner */}
      {showReminder && (
        <div className="mx-4 mt-3 flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl animate-fadeIn">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
            <Bell size={16} className="text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-800">Daily Reminder</p>
            <p className="text-xs text-amber-600">You haven&apos;t logged any transactions today</p>
          </div>
          <button
            onClick={() => setReminderDismissed(true)}
            className="p-1 rounded-full hover:bg-amber-100 shrink-0"
          >
            <X size={16} className="text-amber-400" />
          </button>
        </div>
      )}

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
          style={{
            background:
              totalAccountBalance <= 0
                ? "linear-gradient(135deg, #f87171 0%, #ef4444 50%, #dc2626 100%)"
                : totalIncome > 0 && totalExpense > totalIncome * 0.75
                  ? "linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)"
                  : "var(--gradient-card)",
          }}
        >
          <p className="text-sm font-medium text-white/80 text-center">
            Total Balance
          </p>
          <p className="text-3xl font-bold text-center mt-1 tracking-tight">
            {totalAccountBalance < 0 ? `-${formatCurrency(Math.abs(totalAccountBalance), currency)}` : formatCurrency(totalAccountBalance, currency)}
          </p>
          <div className="flex justify-between mt-5 pt-4 border-t border-white/20">
            <div className="text-center flex-1">
              <p className="text-xs text-white/70 uppercase tracking-wide">
                This Month In
              </p>
              <p className="text-sm font-semibold mt-0.5">
                {formatSignedCurrency(totalIncome, currency)}
              </p>
            </div>
            <div className="text-center flex-1">
              <p className="text-xs text-white/70 uppercase tracking-wide">
                This Month Out
              </p>
              <p className="text-sm font-semibold mt-0.5">
                -{formatCurrency(totalExpense, currency)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons — now open modal */}
      <div className="flex gap-3 px-4 mb-4">
        <button
          onClick={() => openModal("INCOME")}
          id="money-in-btn"
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-50 text-emerald-600 font-semibold text-sm hover:bg-emerald-100 transition-colors active:scale-[0.98]"
        >
          <PlusCircle size={18} />
          Money In
        </button>
        <button
          onClick={() => openModal("EXPENSE")}
          id="money-out-btn"
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-50 text-red-500 font-semibold text-sm hover:bg-red-100 transition-colors active:scale-[0.98]"
        >
          <MinusCircle size={18} />
          Money Out
        </button>
      </div>

      {/* Goals Progress */}
      {goals.length > 0 && (
        <div className="px-4 mb-4">
          <Link
            href="/goals"
            className="block bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover-lift transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                  <Target size={16} className="text-amber-500" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900">
                  Goals
                </h3>
              </div>
              <span className="text-xs font-medium text-gray-400">
                {formatCurrency(totalGoalsSaved, currency)} / {formatCurrency(totalGoalsTarget, currency)}
              </span>
            </div>

            {/* Overall progress bar */}
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r from-amber-400 to-amber-500"
                style={{
                  width: `${Math.min(
                    totalGoalsTarget > 0
                      ? (totalGoalsSaved / totalGoalsTarget) * 100
                      : 0,
                    100
                  )}%`,
                }}
              />
            </div>

            {/* Individual goal pills */}
            <div className="space-y-2">
              {goals.slice(0, 3).map((goal) => {
                const pct =
                  goal.targetAmount > 0
                    ? (goal.currentAmount / goal.targetAmount) * 100
                    : 0;
                const isComplete = pct >= 100;
                return (
                  <div key={goal.id} className="flex items-center gap-2">
                    <span className="text-sm shrink-0">
                      {isComplete ? "🎉" : "🎯"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-medium text-gray-700 truncate">
                          {goal.name}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                            isComplete
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {Math.round(pct)}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isComplete
                              ? "bg-emerald-400"
                              : "bg-gradient-to-r from-blue-400 to-indigo-500"
                          }`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {goals.length > 3 && (
              <p className="text-[10px] text-gray-400 text-center mt-2">
                +{goals.length - 3} more goal{goals.length - 3 !== 1 ? "s" : ""}
              </p>
            )}
          </Link>
        </div>
      )}

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
                    {txns.map((txn, idx) => {
                      const isTransfer = txn.type === "TRANSFER";
                      const specialIcon = "⇌";
                      const specialColor = "#3B82F6";
                      const specialName = "Transfer";

                      return (
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
                            backgroundColor: isTransfer
                              ? `${specialColor}15`
                              : txn.category?.color
                                ? `${txn.category.color}15`
                                : "#f3f4f6",
                          }}
                        >
                          {isTransfer ? specialIcon : (txn.category?.icon || "📦")}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {isTransfer ? specialName : (txn.category?.name || "Transaction")}
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
                )
              )}
            </div>
          )}
        </div>
      </div>

      {/* Transaction Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40 animate-fadeIn">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md shadow-xl animate-slideUp max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div
              className="shrink-0 rounded-t-3xl sm:rounded-t-2xl border-b px-4 py-3 flex items-center justify-between"
              style={{
                backgroundColor: `${accentColor}08`,
                borderColor: `${accentColor}20`,
              }}
            >
              <h3 className="text-lg font-bold text-gray-900">
                {isIncome ? "Money In" : "Money Out"}
              </h3>
              <button
                onClick={() => setShowModal(null)}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto">
              {/* Amount */}
              <div className="px-4 pt-6 pb-4 text-center">
                <p className="text-xs font-medium text-gray-500 mb-2">Amount</p>
                <div className="flex items-center justify-center gap-1">
                  <span className={`text-3xl font-bold ${accentText}`}>৳</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className={`text-3xl font-bold ${accentText} bg-transparent border-none outline-none text-center w-44 placeholder-gray-300`}
                    autoFocus
                  />
                </div>
                {amount && parseFloat(amount) > 0 && (
                  <p className="text-xs text-gray-400 mt-1">
                    {formatCurrency(parseFloat(amount), currency)}
                  </p>
                )}
              </div>

              {/* Form Fields */}
              <div className="px-4 pb-4">
                {error && (
                  <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100 mb-4 animate-shake">
                    {error}
                  </div>
                )}

                {/* Category */}
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Category
                  </label>
                  <button
                    onClick={() => setShowCategories(!showCategories)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                      categoryId
                        ? "border-gray-200 bg-white"
                        : "border-dashed border-gray-300 bg-gray-50"
                    }`}
                  >
                    {selectedCategory ? (
                      <>
                        <span
                          className="w-9 h-9 rounded-lg flex items-center justify-center text-base"
                          style={{
                            backgroundColor: selectedCategory.color
                              ? `${selectedCategory.color}15`
                              : "#f3f4f6",
                          }}
                        >
                          {selectedCategory.icon || "📦"}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {selectedCategory.name}
                        </span>
                      </>
                    ) : (
                      <span className="text-sm text-gray-400">
                        Tap to select a category
                      </span>
                    )}
                  </button>

                  {showCategories && (
                    <div className="mt-2 grid grid-cols-3 gap-2 animate-slideDown">
                      {modalCategories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => {
                            setCategoryId(cat.id);
                            setShowCategories(false);
                          }}
                          className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-all ${
                            categoryId === cat.id
                              ? `border-2 ${accentBg}`
                              : "border-gray-100 hover:bg-gray-50"
                          }`}
                          style={
                            categoryId === cat.id
                              ? { borderColor: accentColor }
                              : {}
                          }
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
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Account */}
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Account
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {accounts.map((acc) => (
                      <button
                        key={acc.id}
                        onClick={() => setAccountId(acc.id)}
                        className={`px-3.5 py-2 rounded-xl text-sm font-medium border transition-all ${
                          accountId === acc.id
                            ? `${accentBg} ${accentText} border-2`
                            : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                        }`}
                        style={
                          accountId === acc.id
                            ? { borderColor: accentColor }
                            : {}
                        }
                      >
                        {acc.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date */}
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Date
                  </label>
                  <div className="relative">
                    <Calendar
                      size={16}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Note (Optional)
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Lunch with friends"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Submit - pinned at bottom of modal */}
            <div className="shrink-0 px-4 pt-3 pb-4 border-t border-gray-100 bg-white rounded-b-2xl" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
              <button
                onClick={handleSubmit}
                disabled={isPending || !amount || !categoryId}
                className="w-full py-3 px-4 rounded-xl text-white font-semibold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] flex items-center justify-center gap-2"
                style={{
                  background: isIncome
                    ? "linear-gradient(135deg, #34d399 0%, #10b981 100%)"
                    : "linear-gradient(135deg, #f87171 0%, #ef4444 100%)",
                  boxShadow: isIncome
                    ? "0 8px 24px rgba(16, 185, 129, 0.3)"
                    : "0 8px 24px rgba(239, 68, 68, 0.3)",
                }}
              >
                {isPending ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : (
                  <>
                    <Check size={18} />
                    Save {isIncome ? "Income" : "Expense"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
