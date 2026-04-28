"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, X } from "lucide-react";
import { createPaymentType, deletePaymentType } from "../actions";

const PAYMENT_EMOJIS = [
  "💵", "🏦", "📱", "📲", "💳", "🪙", "💰", "🏧",
  "📧", "🏪", "🤑", "💎", "🔑", "📋",
];

interface PaymentTypeItem {
  id: string;
  name: string;
  icon: string | null;
  _count: { transactions: number };
}

export default function PaymentTypesClient({
  paymentTypes,
}: {
  paymentTypes: PaymentTypeItem[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("💳");
  const [error, setError] = useState("");

  const handleAdd = () => {
    if (!name.trim()) {
      setError("Please enter a name");
      return;
    }
    setError("");
    startTransition(async () => {
      const result = await createPaymentType({
        name: name.trim(),
        icon,
      });
      if (result.error) {
        setError(result.error);
      } else {
        setShowAdd(false);
        setName("");
        router.refresh();
      }
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const result = await deletePaymentType(id);
      if (result.error) {
        setError(result.error);
        setTimeout(() => setError(""), 3000);
      } else {
        router.refresh();
      }
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
          <h1 className="text-lg font-bold text-gray-900">
            Payment Types
          </h1>
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

      {error && (
        <div className="mx-4 mt-3 bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100 animate-shake">
          {error}
        </div>
      )}

      <div className="px-4 pt-4 pb-8">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
          {paymentTypes.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-gray-400 text-sm">No payment types yet</p>
            </div>
          ) : (
            paymentTypes.map((pt) => (
              <div
                key={pt.id}
                className="flex items-center gap-3 px-4 py-3"
              >
                <span className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-lg shrink-0">
                  {pt.icon || "💳"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {pt.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {pt._count.transactions} transaction
                    {pt._count.transactions !== 1 ? "s" : ""}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(pt.id)}
                  disabled={isPending}
                  className="p-1.5 rounded-full hover:bg-red-50 transition-colors disabled:opacity-40"
                >
                  <Trash2
                    size={16}
                    className="text-gray-300 hover:text-red-400"
                  />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Payment Type Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 animate-fadeIn">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md p-6 animate-slideUp shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">
                Add Payment Type
              </h3>
              <button
                onClick={() => setShowAdd(false)}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rocket, Apple Pay"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />

            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Icon
            </p>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {PAYMENT_EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => setIcon(e)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all ${
                    icon === e
                      ? "bg-emerald-50 ring-2 ring-emerald-400"
                      : "bg-gray-50 hover:bg-gray-100"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>

            {/* Preview */}
            <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl mb-4">
              <span className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-lg border border-gray-100">
                {icon}
              </span>
              <span className="text-sm font-medium text-gray-900">
                {name || "Preview"}
              </span>
            </div>

            <button
              onClick={handleAdd}
              disabled={isPending || !name.trim()}
              className="w-full py-3 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-50 active:scale-[0.98]"
            >
              {isPending ? "Adding..." : "Add Payment Type"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
