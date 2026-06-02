"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, X, Check, Pencil } from "lucide-react";
import { createTag, updateTag, deleteTag } from "./actions";

const COLOR_OPTIONS = [
  "#FF6B6B", "#A855F7", "#3B82F6", "#F59E0B", "#EC4899",
  "#10B981", "#6366F1", "#14B8A6", "#8B5CF6", "#64748B",
  "#F43F5E", "#78716C", "#EF4444", "#F97316", "#84CC16",
];

interface TagItem {
  id: string;
  name: string;
  color: string | null;
  _count: { transactions: number };
}

export default function TagsClient({ tags }: { tags: TagItem[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const [error, setError] = useState("");

  const openAdd = () => {
    setEditingId(null);
    setName("");
    setColor(COLOR_OPTIONS[0]);
    setError("");
    setShowForm(true);
  };

  const openEdit = (tag: TagItem) => {
    setEditingId(tag.id);
    setName(tag.name);
    setColor(tag.color || COLOR_OPTIONS[0]);
    setError("");
    setShowForm(true);
  };

  const handleSave = () => {
    if (!name.trim()) {
      setError("Please enter a name");
      return;
    }
    setError("");
    startTransition(async () => {
      const result = editingId
        ? await updateTag(editingId, { name: name.trim(), color })
        : await createTag({ name: name.trim(), color });
      if (result.error) {
        setError(result.error);
      } else {
        setShowForm(false);
        setName("");
        router.refresh();
      }
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const result = await deleteTag(id);
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
          <h1 className="text-lg font-bold text-gray-900">Manage Tags</h1>
          <button
            onClick={openAdd}
            className="p-1.5 rounded-full bg-amber-50 hover:bg-amber-100 transition-colors"
          >
            <Plus size={20} className="text-amber-600" />
          </button>
        </div>
      </header>

      {error && !showForm && (
        <div className="mx-4 mt-3 bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100 animate-shake">
          {error}
        </div>
      )}

      <div className="px-4 pt-4 pb-8">
        {tags.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4 text-2xl">
              🏷️
            </div>
            <h2 className="text-lg font-semibold text-gray-900">No tags yet</h2>
            <p className="text-gray-400 text-sm mt-2 max-w-xs">
              Create tags to group and analyze transactions across categories.
            </p>
            <button
              onClick={openAdd}
              className="mt-5 bg-amber-500 text-white px-6 py-3 rounded-xl font-medium shadow-sm shadow-amber-200"
            >
              Create Tag
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
            {tags.map((tag) => (
              <div key={tag.id} className="flex items-center gap-3 px-4 py-3">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: tag.color || "#64748B" }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{tag.name}</p>
                  <p className="text-xs text-gray-400">
                    {tag._count.transactions} transaction
                    {tag._count.transactions !== 1 ? "s" : ""}
                  </p>
                </div>
                <button
                  onClick={() => openEdit(tag)}
                  disabled={isPending}
                  className="p-1.5 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-40"
                >
                  <Pencil size={15} className="text-gray-300 hover:text-gray-500" />
                </button>
                <button
                  onClick={() => handleDelete(tag.id)}
                  disabled={isPending}
                  className="p-1.5 rounded-full hover:bg-red-50 transition-colors disabled:opacity-40"
                >
                  <Trash2 size={16} className="text-gray-300 hover:text-red-400" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40 animate-fadeIn">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md shadow-xl animate-slideUp">
            <div className="flex items-center justify-between px-6 pt-6 pb-3">
              <h3 className="text-lg font-bold text-gray-900">
                {editingId ? "Edit Tag" : "Add Tag"}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <div className="px-6">
              {error && (
                <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100 mb-4 animate-shake">
                  {error}
                </div>
              )}

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tag name"
                autoFocus
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />

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

              <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-sm font-medium text-gray-900">
                  {name || "Preview"}
                </span>
              </div>
            </div>

            <div
              className="px-6 pt-3 pb-4 border-t border-gray-100 mt-4"
              style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
            >
              <button
                onClick={handleSave}
                disabled={isPending || !name.trim()}
                className="w-full py-3 rounded-xl bg-amber-500 text-white font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : (
                  <>
                    <Check size={18} />
                    {editingId ? "Save Tag" : "Add Tag"}
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
