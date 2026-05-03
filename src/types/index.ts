export type TransactionType = "INCOME" | "EXPENSE" | "TRANSFER";
export type CategoryType = "INCOME" | "EXPENSE";
export type AccountType = "CASH" | "BANK" | "MOBILE_BANKING" | "CREDIT" | "INVESTMENT";
export type ViewPeriod = "monthly" | "weekly" | "yearly";
export type Frequency = "daily" | "weekly" | "monthly" | "yearly";

export interface MonthYear {
  month: number; // 0-11
  year: number;
}

export interface TransactionWithCategory {
  id: string;
  amount: number;
  date: Date;
  description: string | null;
  type: TransactionType;
  category: {
    id: string;
    name: string;
    icon: string | null;
    color: string | null;
    type: CategoryType;
  } | null;
  account: {
    id: string;
    name: string;
    type: AccountType;
  };
}

export interface MonthlySummary {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  transactions: TransactionWithCategory[];
}

export interface CategoryBreakdown {
  categoryId: string;
  categoryName: string;
  categoryIcon: string | null;
  categoryColor: string | null;
  total: number;
  percentage: number;
  count: number;
}
