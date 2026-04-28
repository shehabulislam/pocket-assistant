import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ReportsClient from "./ReportsClient";

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const userId = session.user.id;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
    999
  );

  // Get all transactions for this month
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: { gte: startOfMonth, lte: endOfMonth },
    },
    include: { category: true },
    orderBy: { date: "asc" },
  });

  // Build category breakdown for expenses
  const categoryMap: Record<
    string,
    { name: string; icon: string; color: string; total: number }
  > = {};

  transactions
    .filter((t) => t.type === "EXPENSE")
    .forEach((t) => {
      const key = t.categoryId;
      if (!categoryMap[key]) {
        categoryMap[key] = {
          name: t.category.name,
          icon: t.category.icon || "📦",
          color: t.category.color || "#6B7280",
          total: 0,
        };
      }
      categoryMap[key].total += t.amount;
    });

  const categoryBreakdown = Object.values(categoryMap).sort(
    (a, b) => b.total - a.total
  );

  // Build daily spending data
  const daysInMonth = endOfMonth.getDate();
  const dailyData: { day: number; income: number; expense: number }[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dayTxns = transactions.filter(
      (t) => new Date(t.date).getDate() === d
    );
    dailyData.push({
      day: d,
      income: dayTxns
        .filter((t) => t.type === "INCOME")
        .reduce((s, t) => s + t.amount, 0),
      expense: dayTxns
        .filter((t) => t.type === "EXPENSE")
        .reduce((s, t) => s + t.amount, 0),
    });
  }

  const totalIncome = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((s, t) => s + t.amount, 0);

  // Get user currency
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { currency: true },
  });

  return (
    <ReportsClient
      totalIncome={totalIncome}
      totalExpense={totalExpense}
      categoryBreakdown={categoryBreakdown}
      dailyData={dailyData}
      currency={user?.currency || "BDT"}
      monthLabel={now.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })}
    />
  );
}
