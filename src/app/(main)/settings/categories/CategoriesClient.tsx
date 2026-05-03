"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, X, Check } from "lucide-react";
import { createCategory, deleteCategory } from "../actions";

const EMOJI_OPTIONS = [
  "🍔", "🛍️", "🚗", "💡", "🎬", "🏥", "📚", "🛒",
  "🏠", "🛡️", "🎁", "📦", "💰", "💻", "📈", "🏢",
  "🎉", "💵", "🎮", "✈️", "💊", "👕", "🐕", "☕",
  "🍕", "📱", "🏋️", "🎵", "🚕", "🧹",
];

const COLOR_OPTIONS = [
  "#FF6B6B", "#A855F7", "#3B82F6", "#F59E0B", "#EC4899",
  "#10B981", "#6366F1", "#14B8A6", "#8B5CF6", "#64748B",
  "#F43F5E", "#78716C", "#EF4444", "#F97316", "#84CC16",
];

interface CategoryItem {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  type: "INCOME" | "EXPENSE";
  isDefault: boolean;
  _count: { transactions: number };
}

export default function CategoriesClient({
  categories,
  onBack,
}: {
  categories: CategoryItem[];
  onBack?: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showAdd, setShowAdd] = useState(false);
  const [addType, setAddType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("📦");
  const [color, setColor] = useState("#3B82F6");
  const [error, setError] = useState("");

  const expenseCategories = categories.filter((c) => c.type === "EXPENSE");
  const incomeCategories = categories.filter((c) => c.type === "INCOME");

  const handleAdd = () => {
    if (!name.trim()) {
      setError("Please enter a name");
      return;
    }
    setError("");
    startTransition(async () => {
      const result = await createCategory({
        name: name.trim(),
        icon,
        color,
        type: addType,
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
      const result = await deleteCategory(id);
      if (result.error) {
        setError(result.error);
        setTimeout(() => setError(""), 3000);
      } else {
        router.refresh();
      }
    });
  };

  const renderCategoryList = (cats: CategoryItem[], title: string) => (
    <div className="mb-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 mb-2">
        {title} ({cats.length})
      </p>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
        {cats.map((cat) => (
          <div
            key={cat.id}
            className="flex items-center gap-3 px-4 py-3"
          >
            <span
              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
              style={{
                backgroundColor: cat.color
                  ? `${cat.color}15`
                  : "#f3f4f6",
              }}
            >
              {cat.icon || "📦"}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">
                {cat.name}
              </p>
              <p className="text-xs text-gray-400">
                {cat._count.transactions} transaction
                {cat._count.transactions !== 1 ? "s" : ""}
              </p>
            </div>
            <button
              onClick={() => handleDelete(cat.id)}
              disabled={isPending}
              className="p-1.5 rounded-full hover:bg-red-50 transition-colors disabled:opacity-40"
            >
              <Trash2 size={16} className="text-gray-300 hover:text-red-400" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => onBack ? onBack() : router.back()}
            className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={22} className="text-gray-700" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">
            Manage Categories
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
        {renderCategoryList(expenseCategories, "Expense Categories")}
        {renderCategoryList(incomeCategories, "Income Categories")}
      </div>

      {/* Add Category Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40 animate-fadeIn">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md shadow-xl animate-slideUp max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="shrink-0 flex items-center justify-between px-6 pt-6 pb-3">
              <h3 className="text-lg font-bold text-gray-900">
                Add Category
              </h3>
              <button
                onClick={() => setShowAdd(false)}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6">
              {/* Type Toggle */}
              <div className="flex gap-2 mb-4">
                {(["EXPENSE", "INCOME"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setAddType(t)}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${
                      addType === t
                        ? t === "EXPENSE"
                          ? "bg-red-50 text-red-500 border-red-200"
                          : "bg-emerald-50 text-emerald-600 border-emerald-200"
                        : "bg-gray-50 text-gray-500 border-gray-200"
                    }`}
                  >
                    {t === "EXPENSE" ? "Expense" : "Income"}
                  </button>
                ))}
              </div>

              {/* Name */}
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Category name"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />

              {/* Icon Picker */}
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Icon
              </p>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {EMOJI_OPTIONS.map((e) => (
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

              {/* Color Picker */}
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Color
              </p>
              <div className="flex flex-wrap gap-2 mb-5">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full transition-all ${
                      color === c ? "ring-2 ring-offset-2 ring-gray-400" : ""
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>

              {/* Preview */}
              <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl">
                <span
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                  style={{ backgroundColor: `${color}15` }}
                >
                  {icon}
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {name || "Preview"}
                </span>
              </div>
            </div>

            {/* Submit - pinned at bottom */}
            <div className="shrink-0 px-6 pt-3 pb-4 border-t border-gray-100 bg-white rounded-b-2xl" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
              <button
                onClick={handleAdd}
                disabled={isPending || !name.trim()}
                className="w-full py-3 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-50 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Adding...
                  </span>
                ) : (
                  <>
                    <Check size={18} />
                    Add Category
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
