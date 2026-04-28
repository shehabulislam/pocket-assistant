"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, Check, Trash2 } from "lucide-react";
import { updateTransaction, deleteTransaction } from "../actions";
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

interface PaymentType {
  id: string;
  name: string;
  icon: string | null;
}

interface TransactionData {
  id: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  date: string;
  description: string | null;
  categoryId: string;
  accountId: string;
  paymentTypeId: string | null;
  category: Category;
}

interface EditTransactionClientProps {
  transaction: TransactionData;
  categories: Category[];
  accounts: Account[];
  paymentTypes: PaymentType[];
}

export default function EditTransactionClient({
  transaction,
  categories,
  accounts,
  paymentTypes,
}: EditTransactionClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [amount, setAmount] = useState(transaction.amount.toString());
  const [categoryId, setCategoryId] = useState(transaction.categoryId);
  const [accountId, setAccountId] = useState(transaction.accountId);
  const [paymentTypeId, setPaymentTypeId] = useState(
    transaction.paymentTypeId || ""
  );
  const [description, setDescription] = useState(
    transaction.description || ""
  );
  const [date, setDate] = useState(
    new Date(transaction.date).toISOString().split("T")[0]
  );
  const [error, setError] = useState("");
  const [showCategories, setShowCategories] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isIncome = transaction.type === "INCOME";
  const accentColor = isIncome ? "#10B981" : "#EF4444";
  const accentBg = isIncome ? "bg-emerald-50" : "bg-red-50";
  const accentText = isIncome ? "text-emerald-600" : "text-red-500";

  const selectedCategory = categories.find((c) => c.id === categoryId);

  const handleUpdate = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }
    setError("");

    startTransition(async () => {
      const result = await updateTransaction(transaction.id, {
        amount: parseFloat(amount),
        type: transaction.type,
        categoryId,
        accountId,
        paymentTypeId: paymentTypeId || undefined,
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

  const handleDelete = async () => {
    startTransition(async () => {
      const result = await deleteTransaction(transaction.id);
      if (result.error) {
        setError(result.error);
      } else {
        router.push("/");
        router.refresh();
      }
    });
  };

  return (
    <div className="animate-fadeIn min-h-dvh flex flex-col">
      {/* Header */}
      <header
        className="sticky top-0 z-40 border-b"
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
            Edit {isIncome ? "Income" : "Expense"}
          </h1>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-1.5 rounded-full hover:bg-red-50 transition-colors"
          >
            <Trash2 size={20} className="text-red-400" />
          </button>
        </div>
      </header>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 mx-6 max-w-sm w-full animate-scaleIn shadow-xl">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3">
              <Trash2 size={24} className="text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center">
              Delete Transaction?
            </h3>
            <p className="text-sm text-gray-500 text-center mt-2">
              This will permanently delete this {isIncome ? "income" : "expense"}{" "}
              of {formatCurrency(transaction.amount, "BDT")} and update your
              balance.
            </p>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Amount Display */}
      <div className="px-4 pt-8 pb-6 text-center">
        <p className="text-sm font-medium text-gray-500 mb-2">Amount</p>
        <div className="flex items-center justify-center gap-1">
          <span className={`text-4xl font-bold ${accentText}`}>৳</span>
          <input
            id="edit-amount-input"
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={`text-4xl font-bold ${accentText} bg-transparent border-none outline-none text-center w-48 placeholder-gray-300`}
          />
        </div>
      </div>

      {/* Form Fields */}
      <div className="flex-1 bg-white rounded-t-3xl border-t border-gray-100 shadow-lg px-4 pt-5 pb-8">
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
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 bg-white transition-all"
          >
            {selectedCategory && (
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
            )}
          </button>

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
                    categoryId === cat.id ? { borderColor: accentColor } : {}
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
                  accountId === acc.id ? { borderColor: accentColor } : {}
                }
              >
                {acc.name}
              </button>
            ))}
          </div>
        </div>

        {/* Payment Type */}
        {paymentTypes.length > 0 && (
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Payment Method
            </label>
            <div className="flex gap-2 flex-wrap">
              {paymentTypes.map((pt) => (
                <button
                  key={pt.id}
                  onClick={() =>
                    setPaymentTypeId(paymentTypeId === pt.id ? "" : pt.id)
                  }
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
                    paymentTypeId === pt.id
                      ? `${accentBg} ${accentText} border-2`
                      : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                  }`}
                  style={
                    paymentTypeId === pt.id ? { borderColor: accentColor } : {}
                  }
                >
                  <span className="text-base">{pt.icon}</span>
                  {pt.name}
                </button>
              ))}
            </div>
          </div>
        )}

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
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Description */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Note (Optional)
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Lunch with friends"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
          />
        </div>

        {/* Save */}
        <button
          onClick={handleUpdate}
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
              Update {isIncome ? "Income" : "Expense"}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
