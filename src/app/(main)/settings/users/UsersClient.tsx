"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, KeyRound, X, Eye, EyeOff, Check, ShieldCheck } from "lucide-react";

interface UserRow {
  id: string;
  name: string | null;
  email: string;
  role: "USER" | "SUPERADMIN";
  createdAt: string;
}

export default function UsersClient({
  users,
  currentUserId,
}: {
  users: UserRow[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [target, setTarget] = useState<UserRow | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [doneEmail, setDoneEmail] = useState("");

  const openReset = (u: UserRow) => {
    setTarget(u);
    setNewPassword("");
    setError("");
    setShow(false);
  };

  const closeReset = () => {
    if (loading) return;
    setTarget(null);
    setNewPassword("");
    setError("");
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!target) return;
    setError("");

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: target.id, newPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      setDoneEmail(target.email);
      setTarget(null);
      setNewPassword("");
      setTimeout(() => setDoneEmail(""), 4000);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fadeIn pb-8">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-lg border-b border-gray-100">
        <div className="flex items-center gap-2 px-4 py-3">
          <button
            onClick={() => router.push("/settings")}
            className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={22} className="text-gray-700" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">Manage Users</h1>
        </div>
      </header>

      {doneEmail && (
        <div className="mx-4 mt-4 flex items-center gap-2 bg-emerald-50 text-emerald-700 text-sm px-4 py-3 rounded-xl border border-emerald-100">
          <Check size={16} />
          Password reset for {doneEmail}
        </div>
      )}

      <div className="px-4 pt-4">
        <p className="text-xs text-gray-400 px-1 mb-2">
          {users.length} user{users.length !== 1 ? "s" : ""}
        </p>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
          {users.map((u) => (
            <div key={u.id} className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 text-sm font-semibold text-gray-500">
                {(u.name || u.email).charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {u.name || "Unnamed"}
                  </p>
                  {u.role === "SUPERADMIN" && (
                    <ShieldCheck size={13} className="text-amber-500 shrink-0" />
                  )}
                  {u.id === currentUserId && (
                    <span className="text-[10px] text-gray-400">(you)</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 truncate">{u.email}</p>
              </div>
              <button
                onClick={() => openReset(u)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-amber-600 bg-amber-50 hover:bg-amber-100 transition-colors shrink-0"
              >
                <KeyRound size={13} />
                Reset
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Reset modal */}
      {target && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 animate-fadeIn"
          onClick={closeReset}
        >
          <div
            className="w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-3xl p-5 animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900">Reset Password</h2>
              <button
                onClick={closeReset}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <X size={18} className="text-gray-400" />
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              Set a new password for{" "}
              <span className="font-medium text-gray-800">{target.email}</span>.
              Share it with them so they can sign in and change it.
            </p>

            <form onSubmit={handleReset} className="space-y-4">
              {error && (
                <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100 animate-shake">
                  {error}
                </div>
              )}

              <div className="relative">
                <input
                  type={show ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password (min 6 chars)"
                  required
                  autoFocus
                  autoComplete="new-password"
                  className="w-full pl-4 pr-11 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={show ? "Hide password" : "Show password"}
                >
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 text-white font-semibold shadow-lg shadow-emerald-200 hover:from-emerald-500 hover:to-teal-600 transition-all disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Resetting...
                  </span>
                ) : (
                  "Reset Password"
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
