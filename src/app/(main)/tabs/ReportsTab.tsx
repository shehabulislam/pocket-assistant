"use client";

import { formatCurrency } from "@/lib/utils";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";

interface CategoryBreakdown {
  name: string;
  icon: string;
  color: string;
  total: number;
}

interface DailyData {
  day: number;
  income: number;
  expense: number;
}

interface ReportsClientProps {
  totalIncome: number;
  totalExpense: number;
  categoryBreakdown: CategoryBreakdown[];
  dailyData: DailyData[];
  currency: string;
  monthLabel: string;
}

export default function ReportsTab({
  totalIncome,
  totalExpense,
  categoryBreakdown,
  dailyData,
  currency,
  monthLabel,
}: ReportsClientProps) {
  const net = totalIncome - totalExpense;
  const maxCategory = categoryBreakdown[0]?.total || 1;

  // For the pie chart, use expense categories
  const pieData = categoryBreakdown.map((c) => ({
    name: c.name,
    value: c.total,
    color: c.color,
  }));

  // Filter daily data to only show days that have activity
  const activeDays = dailyData.filter((d) => d.income > 0 || d.expense > 0);

  const hasData = totalIncome > 0 || totalExpense > 0;

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="px-4 py-3">
          <h1 className="text-lg font-bold text-gray-900 text-center">
            Reports
          </h1>
          <p className="text-xs text-gray-400 text-center mt-0.5">
            {monthLabel}
          </p>
        </div>
      </header>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-24 px-4">
          <div className="w-20 h-20 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
            <Wallet size={36} className="text-emerald-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">
            No data yet
          </h2>
          <p className="text-gray-400 text-sm mt-2 text-center max-w-xs">
            Add some transactions to see your spending reports and analytics.
          </p>
        </div>
      ) : (
        <div className="px-4 pt-4 pb-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-2 mb-5">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 text-center">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center mx-auto mb-1.5">
                <TrendingUp size={16} className="text-emerald-500" />
              </div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">
                Income
              </p>
              <p className="text-sm font-bold text-emerald-500 mt-0.5">
                {formatCurrency(totalIncome, currency)}
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 text-center">
              <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center mx-auto mb-1.5">
                <TrendingDown size={16} className="text-red-500" />
              </div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">
                Expense
              </p>
              <p className="text-sm font-bold text-red-500 mt-0.5">
                {formatCurrency(totalExpense, currency)}
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 text-center">
              <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center mx-auto mb-1.5">
                <Wallet size={16} className="text-blue-500" />
              </div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">
                Net
              </p>
              <p
                className={`text-sm font-bold mt-0.5 ${
                  net >= 0 ? "text-emerald-500" : "text-red-500"
                }`}
              >
                {formatCurrency(net, currency)}
              </p>
            </div>
          </div>

          {/* Spending by Category — Pie Chart */}
          {categoryBreakdown.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">
                Spending by Category
              </h2>
              <div className="flex items-center gap-4">
                <div className="w-32 h-32 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={55}
                        paddingAngle={3}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-1.5 min-w-0">
                  {categoryBreakdown.slice(0, 5).map((cat) => (
                    <div key={cat.name} className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-xs text-gray-600 truncate flex-1">
                        {cat.icon} {cat.name}
                      </span>
                      <span className="text-xs font-medium text-gray-900 shrink-0">
                        {formatCurrency(cat.total, currency)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Category Breakdown — Progress Bars */}
          {categoryBreakdown.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">
                Category Breakdown
              </h2>
              <div className="space-y-3">
                {categoryBreakdown.map((cat) => {
                  const pct = (cat.total / maxCategory) * 100;
                  const totalPct =
                    totalExpense > 0
                      ? ((cat.total / totalExpense) * 100).toFixed(1)
                      : "0";
                  return (
                    <div key={cat.name}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{cat.icon}</span>
                          <span className="text-xs font-medium text-gray-700">
                            {cat.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">
                            {totalPct}%
                          </span>
                          <span className="text-xs font-semibold text-gray-900">
                            {formatCurrency(cat.total, currency)}
                          </span>
                        </div>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700 ease-out"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: cat.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Daily Spending — Bar Chart */}
          {activeDays.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">
                Daily Spending
              </h2>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activeDays} barGap={2}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f0f0f0"
                    />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 10, fill: "#9CA3AF" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "#9CA3AF" }}
                      axisLine={false}
                      tickLine={false}
                      width={40}
                      tickFormatter={(v) =>
                        v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v.toString()
                      }
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "12px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                        fontSize: "12px",
                      }}
                      formatter={(value: any, name: any) => [
                        formatCurrency(Number(value || 0), currency),
                        name === "income" ? "Income" : "Expense",
                      ]}
                      labelFormatter={(label) => `Day ${label}`}
                    />
                    <Bar
                      dataKey="income"
                      fill="#34D399"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={20}
                    />
                    <Bar
                      dataKey="expense"
                      fill="#F87171"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={20}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-4 mt-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <span className="text-xs text-gray-500">Income</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <span className="text-xs text-gray-500">Expense</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
