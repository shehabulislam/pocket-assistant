"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, X, Check, Receipt, ArrowRightLeft } from "lucide-react";
import { createAccount, deleteAccount, getAccountTransactions, transferBalance } from "../actions";
import { deleteTransaction } from "../../transaction/actions";
import { formatCurrency } from "@/lib/utils";

const ACCOUNT_TYPES = [
  { value: "CASH", label: "Cash", icon: "💵", color: "#10B981" },
  { value: "BANK", label: "Bank", icon: "🏦", color: "#3B82F6" },
  { value: "MOBILE_BANKING", label: "Mobile Banking", icon: "📱", color: "#06B6D4" },
  { value: "CREDIT", label: "Credit", icon: "💳", color: "#F59E0B" },
  { value: "INVESTMENT", label: "Investment", icon: "📈", color: "#8B5CF6" },
] as const;

const ACCOUNT_ICONS = [
  "💵", "🏦", "💳", "📈", "📱", "📲", "💰", "🪙",
  "🏧", "🏪", "💎", "🔑", "🤑", "🏢", "💻", "🧾",
];

interface AccountItem {
  id: string;
  name: string;
  type: "CASH" | "BANK" | "MOBILE_BANKING" | "CREDIT" | "INVESTMENT";
  balance: number;
  _count: { transactions: number };
}

function getTypeInfo(type: string) {
  return ACCOUNT_TYPES.find((t) => t.value === type) || ACCOUNT_TYPES[0];
}

export default function AccountsClient({
  accounts,
  onBack,
}: {
  accounts: AccountItem[];
  onBack?: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<"CASH" | "BANK" | "MOBILE_BANKING" | "CREDIT" | "INVESTMENT">("BANK");
  const [icon, setIcon] = useState("🏦");
  const [balance, setBalance] = useState("0");
  const [error, setError] = useState("");

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  // Account detail state
  const [selectedAccount, setSelectedAccount] = useState<AccountItem | null>(null);
  const [accountTxns, setAccountTxns] = useState<any[]>([]);
  const [loadingTxns, setLoadingTxns] = useState(false);

  // Transfer state
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferFrom, setTransferFrom] = useState(accounts[0]?.id || "");
  const [transferTo, setTransferTo] = useState(accounts[1]?.id || "");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferError, setTransferError] = useState("");

  const openAccountDetail = async (account: AccountItem) => {
    setSelectedAccount(account);
    setLoadingTxns(true);
    const result = await getAccountTransactions(account.id);
    setAccountTxns(result.transactions || []);
    setLoadingTxns(false);
  };

  const handleAdd = () => {
    if (!name.trim()) {
      setError("Please enter an account name");
      return;
    }
    setError("");

    startTransition(async () => {
      const result = await createAccount({
        name: name.trim(),
        type,
        icon,
        balance: parseFloat(balance) || 0,
      });
      if (result.error) {
        setError(result.error);
      } else {
        setShowAdd(false);
        setName("");
        setBalance("0");
        router.refresh();
      }
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const result = await deleteAccount(id);
      if (result.error) {
        setError(result.error);
        setTimeout(() => setError(""), 3000);
      } else {
        router.refresh();
      }
    });
  };

  const openTransferModal = () => {
    setShowTransfer(true);
    setTransferFrom(accounts[0]?.id || "");
    setTransferTo(accounts[1]?.id || accounts[0]?.id || "");
    setTransferAmount("");
    setTransferError("");
  };

  const handleTransfer = () => {
    if (!transferAmount || parseFloat(transferAmount) <= 0) {
      setTransferError("Please enter a valid amount");
      return;
    }
    if (transferFrom === transferTo) {
      setTransferError("Select different accounts");
      return;
    }
    setTransferError("");
    startTransition(async () => {
      const result = await transferBalance({
        fromAccountId: transferFrom,
        toAccountId: transferTo,
        amount: parseFloat(transferAmount),
      });
      if (result.error) {
        setTransferError(result.error);
      } else {
        setShowTransfer(false);
        router.refresh();
      }
    });
  };

  // Account detail view
  if (selectedAccount) {
    const typeInfo = getTypeInfo(selectedAccount.type);
    return (
      <div className="animate-fadeIn">
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-100">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setSelectedAccount(null)}
              className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft size={22} className="text-gray-700" />
            </button>
            <h1 className="text-lg font-bold text-gray-900">
              {selectedAccount.name}
            </h1>
            <div className="w-8" />
          </div>
        </header>

        {/* Account Summary */}
        <div className="px-4 pt-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4 flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
              style={{ backgroundColor: `${typeInfo.color}15` }}
            >
              {typeInfo.icon}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">{selectedAccount.name}</p>
              <p className="text-xs text-gray-400">{typeInfo.label} · {selectedAccount._count.transactions} transactions</p>
            </div>
            <p className={`text-lg font-bold ${selectedAccount.balance >= 0 ? "text-emerald-600" : "text-red-500"}`}>
              {formatCurrency(selectedAccount.balance, "BDT")}
            </p>
          </div>
        </div>

        {/* Transaction List */}
        <div className="px-4 pb-8">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Transactions
          </p>

          {loadingTxns ? (
            <div className="flex items-center justify-center py-12">
              <span className="w-6 h-6 border-2 border-gray-200 border-t-emerald-500 rounded-full animate-spin" />
            </div>
          ) : accountTxns.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <Receipt size={24} className="text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-500">No transactions yet</p>
              <p className="text-xs text-gray-400 mt-1">Transactions for this account will show here</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
              {accountTxns.map((txn: any) => (
                <div key={txn.id} className="flex items-center gap-3 px-4 py-3">
                  <span
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                    style={{ backgroundColor: txn.category?.color ? `${txn.category.color}15` : "#f3f4f6" }}
                  >
                    {txn.category?.icon || "📦"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {txn.description || txn.category?.name || "Transaction"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(txn.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      {" · "}{txn.category?.name}
                    </p>
                  </div>
                  <p className={`text-sm font-bold ${txn.type === "INCOME" ? "text-emerald-600" : "text-red-500"}`}>
                    {txn.type === "INCOME" ? "+" : "-"}{formatCurrency(txn.amount, "BDT")}
                  </p>
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (!confirm("Delete this transaction?")) return;
                      startTransition(async () => {
                        await deleteTransaction(txn.id);
                        setAccountTxns((prev) => prev.filter((t: any) => t.id !== txn.id));
                        router.refresh();
                      });
                    }}
                    disabled={isPending}
                    className="p-1 rounded-full hover:bg-red-50 transition-colors disabled:opacity-40 shrink-0"
                  >
                    <Trash2 size={14} className="text-gray-300 hover:text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

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
            Manage Accounts
          </h1>
          <div className="flex items-center gap-1.5">
            {accounts.length >= 2 && (
              <button
                onClick={openTransferModal}
                className="p-1.5 rounded-full bg-blue-50 hover:bg-blue-100 transition-colors"
                id="transfer-btn"
              >
                <ArrowRightLeft size={20} className="text-blue-600" />
              </button>
            )}
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
        </div>
      </header>

      {error && (
        <div className="mx-4 mt-3 bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100 animate-shake">
          {error}
        </div>
      )}

      <div className="px-4 pt-4 pb-8">
        {/* Total Balance Summary */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Total Balance
          </p>
          <p className={`text-xl font-bold ${totalBalance >= 0 ? "text-emerald-600" : "text-red-500"}`}>
            {formatCurrency(totalBalance, "BDT")}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            Across {accounts.length} account{accounts.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Account List */}
        <div className="space-y-3">
          {accounts.map((account) => {
            const typeInfo = getTypeInfo(account.type);
            return (
              <button
                onClick={() => openAccountDetail(account)}
                key={account.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover-lift cursor-pointer w-full text-left"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
                    style={{ backgroundColor: `${typeInfo.color}15` }}
                  >
                    {typeInfo.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {account.name}
                      </p>
                      <span
                        className="text-[10px] font-medium px-1.5 py-0.5 rounded-full uppercase tracking-wide"
                        style={{
                          backgroundColor: `${typeInfo.color}15`,
                          color: typeInfo.color,
                        }}
                      >
                        {typeInfo.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {account._count.transactions} transaction
                      {account._count.transactions !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <p
                      className={`text-sm font-bold ${
                        account.balance >= 0
                          ? "text-emerald-600"
                          : "text-red-500"
                      }`}
                    >
                      {formatCurrency(account.balance, "BDT")}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(account.id);
                      }}
                      disabled={isPending}
                      className="p-1.5 rounded-full hover:bg-red-50 transition-colors disabled:opacity-40"
                    >
                      <Trash2
                        size={14}
                        className="text-gray-300 hover:text-red-400"
                      />
                    </button>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Add Account Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40 animate-fadeIn">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md shadow-xl animate-slideUp max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="shrink-0 flex items-center justify-between px-6 pt-6 pb-3">
              <h3 className="text-lg font-bold text-gray-900">
                Add Account
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
              {/* Account Name */}
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Account Name
              </p>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. bKash, Nagad, DBBL"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />

              {/* Account Type */}
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Account Type
              </p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {ACCOUNT_TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => {
                      setType(t.value);
                      setIcon(t.icon);
                    }}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      type === t.value
                        ? "border-2 bg-emerald-50 text-emerald-700 border-emerald-400"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-lg">{t.icon}</span>
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Initial Balance */}
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Initial Balance
              </p>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg font-bold text-gray-400">৳</span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  placeholder="0.00"
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-lg font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                />
              </div>

              {/* Preview */}
              <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                  style={{
                    backgroundColor: `${
                      ACCOUNT_TYPES.find((t) => t.value === type)?.color || "#10B981"
                    }15`,
                  }}
                >
                  {icon}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {name || "Account Name"}
                  </p>
                  <p className="text-xs text-gray-400">
                    {ACCOUNT_TYPES.find((t) => t.value === type)?.label || "Cash"} · {formatCurrency(parseFloat(balance) || 0, "BDT")}
                  </p>
                </div>
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
                    Add Account
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Balance Modal */}
      {showTransfer && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40 animate-fadeIn">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md shadow-xl animate-slideUp max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div
              className="shrink-0 rounded-t-3xl sm:rounded-t-2xl border-b px-4 py-3 flex items-center justify-between"
              style={{ backgroundColor: '#3b82f608', borderColor: '#3b82f620' }}
            >
              <h3 className="text-lg font-bold text-gray-900">
                Transfer Balance
              </h3>
              <button
                onClick={() => setShowTransfer(false)}
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
                  <span className="text-3xl font-bold text-blue-600">৳</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    placeholder="0.00"
                    className="text-3xl font-bold text-blue-600 bg-transparent border-none outline-none text-center w-44 placeholder-gray-300"
                    autoFocus
                  />
                </div>
                {transferAmount && parseFloat(transferAmount) > 0 && (
                  <p className="text-xs text-gray-400 mt-1">
                    {formatCurrency(parseFloat(transferAmount), "BDT")}
                  </p>
                )}
              </div>

              {/* Form Fields */}
              <div className="px-4 pb-4">
                {transferError && (
                  <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100 mb-4 animate-shake">
                    {transferError}
                  </div>
                )}

                {/* From Account */}
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    From
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {accounts.map((acc) => {
                      const info = getTypeInfo(acc.type);
                      return (
                        <button
                          key={acc.id}
                          onClick={() => setTransferFrom(acc.id)}
                          className={`px-3.5 py-2 rounded-xl text-sm font-medium border transition-all flex items-center gap-2 ${
                            transferFrom === acc.id
                              ? "bg-blue-50 text-blue-600 border-2 border-blue-400"
                              : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                          }`}
                        >
                          <span className="text-base">{info.icon}</span>
                          <span>{acc.name}</span>
                          <span className="text-[10px] text-gray-400 font-normal">
                            {formatCurrency(acc.balance, "BDT")}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Arrow Indicator */}
                <div className="flex justify-center my-1">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                    <ArrowRightLeft size={16} className="text-blue-500 rotate-90" />
                  </div>
                </div>

                {/* To Account */}
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    To
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {accounts
                      .filter((acc) => acc.id !== transferFrom)
                      .map((acc) => {
                        const info = getTypeInfo(acc.type);
                        return (
                          <button
                            key={acc.id}
                            onClick={() => setTransferTo(acc.id)}
                            className={`px-3.5 py-2 rounded-xl text-sm font-medium border transition-all flex items-center gap-2 ${
                              transferTo === acc.id
                                ? "bg-blue-50 text-blue-600 border-2 border-blue-400"
                                : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                            }`}
                          >
                            <span className="text-base">{info.icon}</span>
                            <span>{acc.name}</span>
                            <span className="text-[10px] text-gray-400 font-normal">
                              {formatCurrency(acc.balance, "BDT")}
                            </span>
                          </button>
                        );
                      })}
                  </div>
                </div>

                {/* Transfer Summary Preview */}
                {transferFrom && transferTo && transferAmount && parseFloat(transferAmount) > 0 && (
                  <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                    <p className="text-xs text-blue-600 text-center">
                      <span className="font-semibold">{accounts.find(a => a.id === transferFrom)?.name}</span>
                      {" → "}
                      <span className="font-semibold">{accounts.find(a => a.id === transferTo)?.name}</span>
                    </p>
                    <p className="text-center text-sm font-bold text-blue-700 mt-1">
                      {formatCurrency(parseFloat(transferAmount), "BDT")}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Submit - pinned at bottom */}
            <div className="shrink-0 px-4 pt-3 pb-4 border-t border-gray-100 bg-white rounded-b-2xl" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
              <button
                onClick={handleTransfer}
                disabled={isPending || !transferAmount || !transferFrom || !transferTo || transferFrom === transferTo}
                className="w-full py-3 px-4 rounded-xl text-white font-semibold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] flex items-center justify-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
                  boxShadow: '0 8px 24px rgba(59, 130, 246, 0.3)',
                }}
              >
                {isPending ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Transferring...
                  </span>
                ) : (
                  <>
                    <ArrowRightLeft size={18} />
                    Transfer
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
