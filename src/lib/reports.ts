import { prisma } from "@/lib/prisma";

export interface CategoryBreakdownItem {
  categoryId: string;
  name: string;
  icon: string;
  color: string;
  total: number;
}

export interface DailyDatum {
  day: number;
  income: number;
  expense: number;
}

export interface MonthReport {
  totalIncome: number;
  totalExpense: number;
  categoryBreakdown: CategoryBreakdownItem[];
  dailyData: DailyDatum[];
  /** Expense totals keyed by categoryId — used for budget spend calculations. */
  expenseByCategory: Record<string, number>;
}

/**
 * Inclusive [start, end] bounds for the given month, in server-local time.
 * Kept consistent with the rest of the app (budgets, home) so buckets align.
 */
export function getMonthRange(year: number, month: number): {
  start: Date;
  end: Date;
} {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

/**
 * Single source of truth for monthly report aggregates.
 *
 * Aggregates over ALL transactions in the month — never a truncated page — so
 * report totals always agree with budgets and the raw transaction history.
 * TRANSFER transactions are intentionally excluded from income/expense.
 */
export async function getMonthReport(
  userId: string,
  year: number,
  month: number
): Promise<MonthReport> {
  const { start, end } = getMonthRange(year, month);

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: { gte: start, lte: end },
      type: { in: ["INCOME", "EXPENSE"] },
    },
    include: { category: true },
    orderBy: { date: "asc" },
  });

  let totalIncome = 0;
  let totalExpense = 0;
  const categoryMap: Record<string, CategoryBreakdownItem> = {};
  const expenseByCategory: Record<string, number> = {};

  const daysInMonth = end.getDate();
  const dailyData: DailyDatum[] = Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    income: 0,
    expense: 0,
  }));

  for (const t of transactions) {
    const dayIndex = new Date(t.date).getDate() - 1;
    const bucket = dailyData[dayIndex];

    if (t.type === "INCOME") {
      totalIncome += t.amount;
      if (bucket) bucket.income += t.amount;
    } else {
      // EXPENSE
      totalExpense += t.amount;
      if (bucket) bucket.expense += t.amount;

      const key = t.categoryId ?? "__uncategorized__";
      expenseByCategory[key] = (expenseByCategory[key] || 0) + t.amount;
      if (!categoryMap[key]) {
        categoryMap[key] = {
          categoryId: key,
          name: t.category?.name ?? "Uncategorized",
          icon: t.category?.icon || "📦",
          color: t.category?.color || "#6B7280",
          total: 0,
        };
      }
      categoryMap[key].total += t.amount;
    }
  }

  const categoryBreakdown = Object.values(categoryMap).sort(
    (a, b) => b.total - a.total
  );

  return {
    totalIncome,
    totalExpense,
    categoryBreakdown,
    dailyData,
    expenseByCategory,
  };
}
