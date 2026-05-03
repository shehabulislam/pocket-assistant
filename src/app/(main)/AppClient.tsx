"use client";

import { useState } from "react";
import HomeTab from "./tabs/HomeTab";
import ReportsTab from "./tabs/ReportsTab";
import SettingsTab from "./tabs/SettingsTab";
import BottomNav from "@/components/BottomNav";
import type { TransactionWithCategory } from "@/types";

// ── Shared types ──
export interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  type: string;
}

export interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
}

export interface GoalItem {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string | null;
}

export interface CategoryBreakdown {
  name: string;
  icon: string;
  color: string;
  total: number;
}

export interface DailyData {
  day: number;
  income: number;
  expense: number;
}

export interface BudgetItem {
  id: string;
  limit: number;
  categoryId: string;
  category: {
    id: string;
    name: string;
    icon: string | null;
    color: string | null;
  };
}

export interface UserSettings {
  name: string | null;
  email: string;
  currency: string;
  language: string;
  budgetPeriod: number;
  viewPeriod: string;
  role: string;
  settings: {
    theme: string;
    pushNotifications: boolean;
    dailyReminder: boolean;
    weeklySummary: boolean;
  } | null;
}

export interface CategoryWithCount {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  type: "INCOME" | "EXPENSE";
  isDefault: boolean;
  _count: { transactions: number };
}

export interface AccountWithCount {
  id: string;
  name: string;
  type: "CASH" | "BANK" | "MOBILE_BANKING" | "CREDIT" | "INVESTMENT";
  balance: number;
  _count: { transactions: number };
}

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

export type ActiveTab = "home" | "reports" | "settings";

interface AppClientProps {
  // Home data
  transactions: TransactionWithCategory[];
  totalIncome: number;
  totalExpense: number;
  currency: string;
  currentMonth: number;
  currentYear: number;
  goals: GoalItem[];
  incomeCategories: Category[];
  expenseCategories: Category[];
  accounts: Account[];
  hasTransactionsToday: boolean;
  // Reports data
  reportsTotalIncome: number;
  reportsTotalExpense: number;
  categoryBreakdown: CategoryBreakdown[];
  dailyData: DailyData[];
  monthLabel: string;
  // Budget data
  budgets: BudgetItem[];
  spendingByCategory: Record<string, number>;
  totalBudget: number;
  totalSpent: number;
  currentBudgetMonth: string;
  budgetMonthLabel: string;
  // Settings data
  user: UserSettings;
  // Settings sub-views
  categoriesWithCounts: CategoryWithCount[];
  accountsWithCounts: AccountWithCount[];
  allGoals: GoalItem[];
  allLoans: LoanItem[];
}

export default function AppClient(props: AppClientProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("home");

  return (
    <div className="min-h-dvh bg-[var(--background)]">
      {/* Main content — padded bottom for nav */}
      <main className="max-w-md mx-auto pb-24">
        {/* Tabs render based on active state — all mounted but only active is visible */}
        <div style={{ display: activeTab === "home" ? "block" : "none" }}>
          <HomeTab
            transactions={props.transactions}
            totalIncome={props.totalIncome}
            totalExpense={props.totalExpense}
            currency={props.currency}
            currentMonth={props.currentMonth}
            currentYear={props.currentYear}
            goals={props.goals}
            incomeCategories={props.incomeCategories}
            expenseCategories={props.expenseCategories}
            accounts={props.accounts}
            hasTransactionsToday={props.hasTransactionsToday}
            dailyReminder={props.user.settings?.dailyReminder ?? false}
            budgets={props.budgets}
            spendingByCategory={props.spendingByCategory}
            totalBudget={props.totalBudget}
            totalSpent={props.totalSpent}
            currentBudgetMonth={props.currentBudgetMonth}
            budgetMonthLabel={props.budgetMonthLabel}
          />
        </div>

        <div style={{ display: activeTab === "reports" ? "block" : "none" }}>
          <ReportsTab
            totalIncome={props.reportsTotalIncome}
            totalExpense={props.reportsTotalExpense}
            categoryBreakdown={props.categoryBreakdown}
            dailyData={props.dailyData}
            currency={props.currency}
            monthLabel={props.monthLabel}
            loans={props.allLoans}
          />
        </div>

        <div style={{ display: activeTab === "settings" ? "block" : "none" }}>
          <SettingsTab
            user={props.user}
            categoriesWithCounts={props.categoriesWithCounts}
            accountsWithCounts={props.accountsWithCounts}
            allGoals={props.allGoals}
            currency={props.currency}
            budgets={props.budgets}
            expenseCategories={props.expenseCategories}
            spendingByCategory={props.spendingByCategory}
            totalBudget={props.totalBudget}
            totalSpent={props.totalSpent}
            currentBudgetMonth={props.currentBudgetMonth}
            budgetMonthLabel={props.budgetMonthLabel}
            allLoans={props.allLoans}
          />
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
