"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, X, Check, HandCoins, ArrowDownLeft, ArrowUpRight, Trash2, CircleDollarSign } from "lucide-react";
import { createLoan, recordLoanPayment, settleLoan, deleteLoan } from "./actions";
import { formatCurrency } from "@/lib/utils";

export interface LoanItem {
  id: string;
  type: "GIVEN" | "TAKEN";
  personName: string;
  amount: number;
  remainingAmount: number;
  description: string | null;
  deadline: string | null;
  isSettled: boolean;
  createdAt: string;
}

export default function LoansClient({
  loans,
  currency,
  onBack,
}: {
  loans: LoanItem[];
  currency: string;
  onBack?: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showAdd, setShowAdd] = useState(false);
  const [loanType, setLoanType] = useState<"GIVEN" | "TAKEN">("GIVEN");
  const [personName, setPersonName] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [error, setError] = useState("");

  // Payment modal
  const [payLoan, setPayLoan] = useState<LoanItem | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payError, setPayError] = useState("");

  const activeLoans = loans.filter((l) => !l.isSettled);
  const settledLoans = loans.filter((l) => l.isSettled);
  const totalGiven = activeLoans.filter((l) => l.type === "GIVEN").reduce((s, l) => s + l.remainingAmount, 0);
  const totalTaken = activeLoans.filter((l) => l.type === "TAKEN").reduce((s, l) => s + l.remainingAmount, 0);

  const handleAdd = () => {
    if (!personName.trim()) { setError("Enter person name"); return; }
    if (!amount || parseFloat(amount) <= 0) { setError("Enter valid amount"); return; }
    setError("");
    startTransition(async () => {
      const result = await createLoan({
        type: loanType,
        personName: personName.trim(),
        amount: parseFloat(amount),
        description: description || undefined,
        deadline: deadline || undefined,
      });
      if (result.error) setError(result.error);
      else {
        setShowAdd(false); setPersonName(""); setAmount(""); setDescription("");
        setDeadline(""); router.refresh();
      }
    });
  };

  const handlePay = () => {
    if (!payAmount || parseFloat(payAmount) <= 0) { setPayError("Enter valid amount"); return; }
    setPayError("");
    startTransition(async () => {
      const result = await recordLoanPayment({ loanId: payLoan!.id, amount: parseFloat(payAmount) });
      if (result.error) setPayError(result.error);
      else { setPayLoan(null); setPayAmount(""); router.refresh(); }
    });
  };

  const handleSettle = (id: string) => {
    startTransition(async () => { await settleLoan(id); router.refresh(); });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => { await deleteLoan(id); router.refresh(); });
  };

  const renderLoan = (loan: LoanItem) => {
    const paidPct = loan.amount > 0 ? ((loan.amount - loan.remainingAmount) / loan.amount) * 100 : 0;
    const isGiven = loan.type === "GIVEN";
    const color = isGiven ? "#F59E0B" : "#8B5CF6";
    return (
      <div key={loan.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-3">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}15` }}>
            {isGiven ? <ArrowUpRight size={18} style={{ color }} /> : <ArrowDownLeft size={18} style={{ color }} />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-gray-900 truncate">{loan.personName}</p>
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full uppercase tracking-wide" style={{ backgroundColor: `${color}15`, color }}>
                {isGiven ? "Given" : "Taken"}
              </span>
            </div>
            {loan.description && <p className="text-xs text-gray-400 truncate">{loan.description}</p>}
          </div>
          <p className={`text-sm font-bold ${isGiven ? "text-amber-600" : "text-purple-600"}`}>
            {formatCurrency(loan.remainingAmount, currency)}
          </p>
        </div>

        {/* Progress */}
        <div className="mb-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-gray-400">
              Paid {formatCurrency(loan.amount - loan.remainingAmount, currency)} of {formatCurrency(loan.amount, currency)}
            </span>
            <span className="text-[10px] font-bold text-gray-500">{Math.round(paidPct)}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${paidPct}%`, backgroundColor: color }} />
          </div>
        </div>

        {loan.deadline && (
          <p className="text-[10px] text-gray-400 mb-2">
            Due: {new Date(loan.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </p>
        )}

        {!loan.isSettled && (
          <div className="flex gap-2 mt-1">
            <button onClick={() => { setPayLoan(loan); setPayAmount(""); setPayError(""); }}
              className="flex-1 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors flex items-center justify-center gap-1">
              <CircleDollarSign size={12} /> Record Payment
            </button>
            <button onClick={() => handleSettle(loan.id)} disabled={isPending}
              className="py-1.5 px-3 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors flex items-center gap-1">
              <Check size={12} /> Settle
            </button>
            <button onClick={() => handleDelete(loan.id)} disabled={isPending}
              className="py-1.5 px-2 rounded-lg text-xs bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-400 transition-colors">
              <Trash2 size={12} />
            </button>
          </div>
        )}
        {loan.isSettled && (
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg">✓ Settled</span>
            <button onClick={() => handleDelete(loan.id)} disabled={isPending}
              className="p-1 rounded-full hover:bg-red-50 transition-colors"><Trash2 size={12} className="text-gray-300 hover:text-red-400" /></button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="animate-fadeIn">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => onBack ? onBack() : router.back()} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft size={22} className="text-gray-700" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">Loans</h1>
          <button onClick={() => { setShowAdd(true); setError(""); }} className="p-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 transition-colors">
            <Plus size={20} className="text-emerald-600" />
          </button>
        </div>
      </header>

      {error && !showAdd && (
        <div className="mx-4 mt-3 bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100 animate-shake">{error}</div>
      )}

      <div className="px-4 pt-4 pb-8">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 text-center">
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center mx-auto mb-1"><ArrowUpRight size={16} className="text-amber-500" /></div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Given (Receivable)</p>
            <p className="text-sm font-bold text-amber-600 mt-0.5">{formatCurrency(totalGiven, currency)}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 text-center">
            <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center mx-auto mb-1"><ArrowDownLeft size={16} className="text-purple-500" /></div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Taken (Payable)</p>
            <p className="text-sm font-bold text-purple-600 mt-0.5">{formatCurrency(totalTaken, currency)}</p>
          </div>
        </div>

        {/* Active Loans */}
        {activeLoans.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Active Loans ({activeLoans.length})</p>
            {activeLoans.map(renderLoan)}
          </div>
        )}

        {/* Settled Loans */}
        {settledLoans.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Settled ({settledLoans.length})</p>
            {settledLoans.map(renderLoan)}
          </div>
        )}

        {loans.length === 0 && (
          <div className="flex flex-col items-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4"><HandCoins size={28} className="text-gray-400" /></div>
            <p className="text-gray-500 font-medium">No loans yet</p>
            <p className="text-gray-400 text-sm mt-1">Tap + to add a loan</p>
          </div>
        )}
      </div>

      {/* Add Loan Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40 animate-fadeIn">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md shadow-xl animate-slideUp max-h-[92vh] flex flex-col">
            <div className="shrink-0 flex items-center justify-between px-6 pt-6 pb-3">
              <h3 className="text-lg font-bold text-gray-900">Add Loan</h3>
              <button onClick={() => setShowAdd(false)} className="p-1 rounded-full hover:bg-gray-100"><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-6">
              {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100 mb-4 animate-shake">{error}</div>}
              {/* Type */}
              <div className="flex gap-2 mb-4">
                {(["GIVEN", "TAKEN"] as const).map((t) => (
                  <button key={t} onClick={() => setLoanType(t)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all flex items-center justify-center gap-2 ${
                      loanType === t
                        ? t === "GIVEN" ? "bg-amber-50 text-amber-600 border-amber-200" : "bg-purple-50 text-purple-600 border-purple-200"
                        : "bg-gray-50 text-gray-500 border-gray-200"
                    }`}>
                    {t === "GIVEN" ? <><ArrowUpRight size={14} /> I Gave</> : <><ArrowDownLeft size={14} /> I Took</>}
                  </button>
                ))}
              </div>
              {/* Person Name */}
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Person Name</p>
              <input type="text" value={personName} onChange={(e) => setPersonName(e.target.value)} placeholder="Who?" className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              {/* Amount */}
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Amount</p>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg font-bold text-gray-400">৳</span>
                <input type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00"
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-lg font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              </div>

              {/* Deadline */}
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Deadline (Optional)</p>
              <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              {/* Note */}
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Note (Optional)</p>
              <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. For house rent"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-emerald-400" />
            </div>
            <div className="shrink-0 px-6 pt-3 pb-4 border-t border-gray-100 bg-white rounded-b-2xl" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
              <button onClick={handleAdd} disabled={isPending || !personName.trim() || !amount}
                className="w-full py-3 rounded-xl text-white font-semibold transition-colors disabled:opacity-50 active:scale-[0.98] flex items-center justify-center gap-2"
                style={{ background: loanType === "GIVEN" ? "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)" : "linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)" }}>
                {isPending ? <span className="inline-flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Adding...</span>
                  : <><Check size={18} /> Add Loan</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {payLoan && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40 animate-fadeIn">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md shadow-xl animate-slideUp p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Record Payment</h3>
              <button onClick={() => setPayLoan(null)} className="p-1 rounded-full hover:bg-gray-100"><X size={20} className="text-gray-400" /></button>
            </div>
            <p className="text-sm text-gray-500 mb-1">Paying for loan with <strong>{payLoan.personName}</strong></p>
            <p className="text-xs text-gray-400 mb-3">Remaining: {formatCurrency(payLoan.remainingAmount, currency)}</p>
            {payError && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100 mb-4 animate-shake">{payError}</div>}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg font-bold text-gray-400">৳</span>
              <input type="number" inputMode="decimal" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder="0.00" autoFocus
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <button onClick={() => { setPayAmount(payLoan.remainingAmount.toString()); }} className="text-xs text-blue-500 font-medium mb-4 block">Pay full remaining amount</button>
            <button onClick={handlePay} disabled={isPending || !payAmount}
              className="w-full py-3 rounded-xl bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50 active:scale-[0.98] flex items-center justify-center gap-2">
              {isPending ? "Saving..." : <><Check size={18} /> Record Payment</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
