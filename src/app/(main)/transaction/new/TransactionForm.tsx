"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, Check } from "lucide-react";
import { createTransaction } from "../actions";
import { formatCurrency } from "@/lib/utils";

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
}

interface TransactionFormProps {
  type: "INCOME" | "EXPENSE";
  categories: Category[];
  accounts: Account[];
}

export default function TransactionForm({
  type,
  categories,
  accounts,
}: TransactionFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState(accounts[0]?.id || "");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [error, setError] = useState("");
  const [showCategories, setShowCategories] = useState(false);

  const isIncome = type === "INCOME";
  const accentColor = isIncome ? "#10B981" : "#EF4444";
  const accentBg = isIncome ? "bg-emerald-50" : "bg-red-50";
  const accentText = isIncome ? "text-emerald-600" : "text-red-500";

  const selectedCategory = categories.find((c) => c.id === categoryId);

  const handleSubmit = async () => {
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
        type,
        categoryId,
        accountId,
        description: description || undefined,
        date,
      });

      if (result.error) {
        setError(result.error);
      } else {
        router.push("/");
        router.refresh();
      }
    });
  };

  return (
    <div className="animate-fadeIn h-dvh flex flex-col">
      {/* Header */}
      <header
        className="shrink-0 border-b"
        style={{
          backgroundColor: `${accentColor}08`,
          borderColor: `${accentColor}20`,
        }}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => router.back()}
            className="p-1.5 rounded-full hover:bg-white/60 transition-colors"
          >
            <ArrowLeft size={22} className="text-gray-700" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">
            {isIncome ? "Money In" : "Money Out"}
          </h1>
          <div className="w-8" />
        </div>
      </header>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Amount Display */}
        <div className="px-4 pt-8 pb-6 text-center">
          <p className="text-sm font-medium text-gray-500 mb-2">Amount</p>
          <div className="flex items-center justify-center gap-1">
            <span className={`text-4xl font-bold ${accentText}`}>
              ৳
            </span>
            <input
              id="amount-input"
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className={`text-4xl font-bold ${accentText} bg-transparent border-none outline-none text-center w-48 placeholder-gray-300`}
              autoFocus
            />
          </div>
          {amount && parseFloat(amount) > 0 && (
            <p className="text-xs text-gray-400 mt-2">
              {formatCurrency(parseFloat(amount), "BDT")}
            </p>
          )}
        </div>

        {/* Form Fields */}
        <div className="bg-white rounded-t-3xl border-t border-gray-100 shadow-lg px-4 pt-5 pb-6">
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
              id="category-select"
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
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
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

            {/* Category Grid */}
            {showCategories && (
              <div className="mt-2 grid grid-cols-3 gap-2 animate-slideDown">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setCategoryId(cat.id);
                      setShowCategories(false);
                    }}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
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
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                      style={{
                        backgroundColor: cat.color
                          ? `${cat.color}15`
                          : "#f3f4f6",
                      }}
                    >
                      {cat.icon || "📦"}
                    </span>
                    <span className="text-[11px] font-medium text-gray-600 text-center leading-tight">
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
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
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
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                id="date-input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Note (Optional)
            </label>
            <input
              id="description-input"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Lunch with friends"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
            />
          </div>
        </div>
      </div>

      {/* Submit - pinned to bottom */}
      <div className="shrink-0 bg-white px-4 py-4 border-t border-gray-100">
        <button
          id="save-transaction-btn"
          onClick={handleSubmit}
          disabled={isPending || !amount || !categoryId}
          className="w-full py-3.5 px-4 rounded-xl text-white font-semibold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] flex items-center justify-center gap-2"
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
  );
}
