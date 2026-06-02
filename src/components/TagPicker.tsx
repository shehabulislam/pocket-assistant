"use client";

import Link from "next/link";
import { Plus } from "lucide-react";

export interface TagOption {
  id: string;
  name: string;
  color: string | null;
}

interface TagPickerProps {
  tags: TagOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

/**
 * Multi-select tag chips for the transaction forms.
 * Tapping a chip toggles it. If the user has no tags yet, links to /tags.
 */
export default function TagPicker({ tags, selectedIds, onChange }: TagPickerProps) {
  const toggle = (id: string) => {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((t) => t !== id)
        : [...selectedIds, id]
    );
  };

  return (
    <div>
      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
        Tags (Optional)
      </label>
      {tags.length === 0 ? (
        <Link
          href="/tags"
          className="flex items-center gap-2 px-4 py-3 rounded-xl border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-400"
        >
          <Plus size={16} />
          Create tags to organize transactions
        </Link>
      ) : (
        <div className="flex gap-2 flex-wrap">
          {tags.map((tag) => {
            const active = selectedIds.includes(tag.id);
            const color = tag.color || "#64748B";
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggle(tag.id)}
                className="px-3 py-2 rounded-xl text-sm font-medium border transition-all flex items-center gap-1.5"
                style={
                  active
                    ? {
                        backgroundColor: `${color}15`,
                        borderColor: color,
                        color,
                      }
                    : { borderColor: "#e5e7eb", color: "#6b7280" }
                }
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: color }}
                />
                {tag.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
