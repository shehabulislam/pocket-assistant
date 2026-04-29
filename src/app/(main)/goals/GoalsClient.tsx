"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Trash2,
  X,
  Check,
  Target,
  TrendingUp,
  Calendar,
  Minus,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { createGoal, updateGoalAmount, deleteGoal } from "./actions";

interface GoalItem {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string | null;
}

interface GoalsClientProps {
  goals: GoalItem[];
  currency: string;
}

const GOAL_ICONS = [
  { emoji: "🏠", label: "Home" },
  { emoji: "🚗", label: "Car" },
  { emoji: "✈️", label: "Travel" },
  { emoji: "📱", label: "Gadget" },
  { emoji: "🎓", label: "Education" },
  { emoji: "💍", label: "Wedding" },
  { emoji: "🏥", label: "Health" },
  { emoji: "💰", label: "Savings" },
  { emoji: "🎯", label: "Other" },
];

export default function GoalsClient({ goals, currency }: GoalsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showAdd, setShowAdd] = useState(false);
  const [showFund, setShowFund] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("0");
  const [deadline, setDeadline] = useState("");
  const [fundAmount, setFundAmount] = useState("");
  const [error, setError] = useState("");

  const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const completedGoals = goals.filter(
    (g) => g.currentAmount >= g.targetAmount
  ).length;

  const handleAdd = () => {
    if (!name.trim()) {
      setError("Please enter a goal name");
      return;
    }
    if (!targetAmount || parseFloat(targetAmount) <= 0) {
      setError("Please enter a valid target amount");
      return;
    }
    setError("");

    startTransition(async () => {
      const result = await createGoal({
        name: name.trim(),
        targetAmount: parseFloat(targetAmount),
        currentAmount: parseFloat(currentAmount) || 0,
        deadline: deadline || null,
      });
      if (result.error) {
        setError(result.error);
      } else {
        setShowAdd(false);
        setName("");
        setTargetAmount("");
        setCurrentAmount("0");
        setDeadline("");
        router.refresh();
      }
    });
  };

  const handleFund = (goalId: string, amount: number) => {
    if (!amount || amount === 0) return;
    startTransition(async () => {
      const result = await updateGoalAmount(goalId, amount);
      if (result.error) {
        setError(result.error);
        setTimeout(() => setError(""), 3000);
      } else {
        setShowFund(null);
        setFundAmount("");
        router.refresh();
      }
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteGoal(id);
      router.refresh();
    });
  };

  const getDeadlineInfo = (deadline: string | null) => {
    if (!deadline) return null;
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffMs = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: "Overdue", color: "text-red-500" };
    if (diffDays === 0) return { text: "Today", color: "text-amber-500" };
    if (diffDays <= 7)
      return { text: `${diffDays}d left`, color: "text-amber-500" };
    if (diffDays <= 30)
      return { text: `${diffDays}d left`, color: "text-blue-500" };
    const months = Math.floor(diffDays / 30);
    return {
      text: months === 1 ? "1 month left" : `${months} months left`,
      color: "text-gray-400",
    };
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
          <h1 className="text-lg font-bold text-gray-900">Goals</h1>
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
        {/* Summary Card */}
        {goals.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Total Saved
                </p>
                <p className="text-xl font-bold text-emerald-600 mt-0.5">
                  {formatCurrency(totalSaved, currency)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Target
                </p>
                <p className="text-xl font-bold text-gray-900 mt-0.5">
                  {formatCurrency(totalTarget, currency)}
                </p>
              </div>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r from-emerald-400 to-emerald-500"
                style={{
                  width: `${Math.min(
                    totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0,
                    100
                  )}%`,
                }}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <p className="text-xs text-gray-400">
                {totalTarget > 0
                  ? `${Math.round((totalSaved / totalTarget) * 100)}% saved`
                  : "0% saved"}
              </p>
              <p className="text-xs text-gray-400">
                {completedGoals}/{goals.length} completed
              </p>
            </div>
          </div>
        )}

        {/* Goals List */}
        {goals.length === 0 ? (
          <div className="flex flex-col items-center py-16 px-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mb-4">
              <Target size={28} className="text-amber-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              No goals yet
            </h2>
            <p className="text-gray-400 text-sm mt-2 text-center max-w-xs">
              Set savings goals and track your progress toward buying a house,
              going on vacation, or anything you dream of.
            </p>
            <button
              onClick={() => setShowAdd(true)}
              className="mt-4 px-5 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-colors active:scale-[0.98]"
            >
              Create First Goal
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {goals.map((goal) => {
              const pct =
                goal.targetAmount > 0
                  ? (goal.currentAmount / goal.targetAmount) * 100
                  : 0;
              const isComplete = pct >= 100;
              const remaining = goal.targetAmount - goal.currentAmount;
              const deadlineInfo = getDeadlineInfo(goal.deadline);

              return (
                <div
                  key={goal.id}
                  className={`bg-white rounded-2xl border shadow-sm p-4 hover-lift transition-all ${
                    isComplete
                      ? "border-emerald-200 bg-emerald-50/30"
                      : "border-gray-100"
                  }`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                        isComplete ? "bg-emerald-100" : "bg-amber-50"
                      }`}
                    >
                      {isComplete ? "🎉" : "🎯"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {goal.name}
                        </p>
                        {isComplete && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-600 uppercase">
                            Done
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">
                        {formatCurrency(goal.currentAmount, currency)} of{" "}
                        {formatCurrency(goal.targetAmount, currency)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          isComplete
                            ? "bg-emerald-50 text-emerald-600"
                            : pct > 60
                            ? "bg-blue-50 text-blue-600"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {Math.round(pct)}%
                      </span>
                      <button
                        onClick={() => handleDelete(goal.id)}
                        disabled={isPending}
                        className="p-1 rounded-full hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={14} className="text-gray-300" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out ${
                        isComplete
                          ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                          : "bg-gradient-to-r from-blue-400 to-indigo-500"
                      }`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {deadlineInfo && (
                        <span
                          className={`text-[10px] font-medium flex items-center gap-0.5 ${deadlineInfo.color}`}
                        >
                          <Calendar size={10} />
                          {deadlineInfo.text}
                        </span>
                      )}
                      {!isComplete && (
                        <span className="text-[10px] text-gray-400">
                          {formatCurrency(remaining, currency)} to go
                        </span>
                      )}
                    </div>

                    {!isComplete && (
                      <button
                        onClick={() => {
                          setShowFund(goal.id);
                          setFundAmount("");
                        }}
                        className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors active:scale-[0.97] flex items-center gap-1"
                      >
                        <TrendingUp size={12} />
                        Add Fund
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Goal Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 animate-fadeIn">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md p-6 animate-slideUp shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">
                New Goal
              </h3>
              <button
                onClick={() => setShowAdd(false)}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            {/* Goal Name */}
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Goal Name
            </p>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. New Laptop, Vacation, Emergency Fund"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />

            {/* Target Amount */}
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Target Amount
            </p>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg font-bold text-gray-400">৳</span>
              <input
                type="number"
                inputMode="decimal"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="50,000"
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-lg font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>

            {/* Already Saved */}
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Already Saved (Optional)
            </p>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg font-bold text-gray-400">৳</span>
              <input
                type="number"
                inputMode="decimal"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
                placeholder="0"
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>

            {/* Deadline */}
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Deadline (Optional)
            </p>
            <div className="relative mb-5">
              <Calendar
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>

            {/* Preview */}
            {name && targetAmount && (
              <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-lg">
                  🎯
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {name}
                  </p>
                  <p className="text-xs text-gray-400">
                    Target: {formatCurrency(parseFloat(targetAmount) || 0, currency)}
                    {deadline && ` · by ${new Date(deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={handleAdd}
              disabled={isPending || !name.trim() || !targetAmount}
              className="w-full py-3 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-50 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {isPending ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </span>
              ) : (
                <>
                  <Check size={18} />
                  Create Goal
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Add Fund Modal */}
      {showFund && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 animate-fadeIn">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md p-6 animate-slideUp shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">
                Add Fund
              </h3>
              <button
                onClick={() => setShowFund(null)}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Amount to Add
            </p>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg font-bold text-gray-400">৳</span>
              <input
                type="number"
                inputMode="decimal"
                value={fundAmount}
                onChange={(e) => setFundAmount(e.target.value)}
                placeholder="1,000"
                autoFocus
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-lg font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>

            {/* Quick amounts */}
            <div className="flex gap-2 mb-5 flex-wrap">
              {[500, 1000, 2000, 5000].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setFundAmount(String(amt))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    fundAmount === String(amt)
                      ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                      : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  +৳{amt.toLocaleString()}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() =>
                  handleFund(showFund, -(parseFloat(fundAmount) || 0))
                }
                disabled={isPending || !fundAmount}
                className="flex-1 py-3 rounded-xl border-2 border-red-200 text-red-500 font-semibold hover:bg-red-50 transition-colors disabled:opacity-50 active:scale-[0.98] flex items-center justify-center gap-1"
              >
                <Minus size={16} />
                Withdraw
              </button>
              <button
                onClick={() =>
                  handleFund(showFund, parseFloat(fundAmount) || 0)
                }
                disabled={isPending || !fundAmount}
                className="flex-1 py-3 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-50 active:scale-[0.98] flex items-center justify-center gap-1"
              >
                {isPending ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Plus size={16} />
                    Add Fund
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
