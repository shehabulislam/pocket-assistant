import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureDefaultCategories } from "@/lib/default-categories";
import BudgetsClient from "./BudgetsClient";

export default async function BudgetsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const userId = session.user.id;

  // Auto-seed default categories if user has none
  await ensureDefaultCategories(userId);

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

  // Get budgets for the current month
  const budgets = await prisma.budget.findMany({
    where: {
      userId,
      month: startOfMonth,
    },
    include: { category: true },
    orderBy: { category: { name: "asc" } },
  });

  // Get expense categories for creating new budgets
  const expenseCategories = await prisma.category.findMany({
    where: { userId, type: "EXPENSE" },
    orderBy: { name: "asc" },
  });

  // Get spending per category for this month
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      type: "EXPENSE",
      date: { gte: startOfMonth, lte: endOfMonth },
    },
    select: { categoryId: true, amount: true },
  });

  const spendingByCategory: Record<string, number> = {};
  for (const txn of transactions) {
    spendingByCategory[txn.categoryId] =
      (spendingByCategory[txn.categoryId] || 0) + txn.amount;
  }

  // Get user currency
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { currency: true },
  });

  // Calculate total budget and total spent
  const totalBudget = budgets.reduce((sum, b) => sum + b.limit, 0);
  const totalSpent = budgets.reduce(
    (sum, b) => sum + (spendingByCategory[b.categoryId] || 0),
    0
  );

  return (
    <BudgetsClient
      budgets={JSON.parse(JSON.stringify(budgets))}
      expenseCategories={JSON.parse(JSON.stringify(expenseCategories))}
      spendingByCategory={spendingByCategory}
      totalBudget={totalBudget}
      totalSpent={totalSpent}
      currency={user?.currency || "BDT"}
      currentMonth={startOfMonth.toISOString()}
      monthLabel={now.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })}
    />
  );
}
