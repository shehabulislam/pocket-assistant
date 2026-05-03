import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureDefaultCategories } from "@/lib/default-categories";
import AppClient from "./AppClient";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const userId = session.user.id;
  const params = await searchParams;
  const now = new Date();

  const month = params.month ? parseInt(params.month) : now.getMonth();
  const year = params.year ? parseInt(params.year) : now.getFullYear();

  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

  // Ensure default categories exist
  await ensureDefaultCategories(userId);

  // ── Fetch ALL data in parallel ──
  const [
    transactions,
    user,
    goals,
    incomeCategories,
    expenseCategories,
    accounts,
    budgets,
    budgetExpenseTransactions,
    categoriesWithCounts,
    accountsWithCounts,
    allGoals,
    allLoans,
  ] = await Promise.all([
    // Home: transactions
    prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: startOfMonth, lte: endOfMonth },
      },
      include: {
        category: true,
        account: true,
      },
      orderBy: { date: "desc" },
      take: 50,
    }),
    // Shared: user info
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        email: true,
        currency: true,
        language: true,
        budgetPeriod: true,
        viewPeriod: true,
        role: true,
        settings: true,
      },
    }),
    // Home: goals (top 5)
    prisma.goal.findMany({
      where: { userId },
      orderBy: [{ currentAmount: "desc" }, { name: "asc" }],
      take: 5,
    }),
    // Shared: income categories
    prisma.category.findMany({
      where: { userId, type: "INCOME" },
      orderBy: { name: "asc" },
    }),
    // Shared: expense categories
    prisma.category.findMany({
      where: { userId, type: "EXPENSE" },
      orderBy: { name: "asc" },
    }),
    // Shared: accounts
    prisma.account.findMany({
      where: { userId },
      orderBy: { name: "asc" },
    }),
    // Budgets
    prisma.budget.findMany({
      where: { userId, month: startOfMonth },
      include: { category: true },
      orderBy: { category: { name: "asc" } },
    }),
    // Budget spending data
    prisma.transaction.findMany({
      where: {
        userId,
        type: "EXPENSE",
        date: { gte: startOfMonth, lte: endOfMonth },
      },
      select: { categoryId: true, amount: true },
    }),
    // Settings: all categories with transaction counts
    prisma.category.findMany({
      where: { userId },
      orderBy: [{ type: "asc" }, { name: "asc" }],
      include: { _count: { select: { transactions: true } } },
    }),
    // Settings: accounts with transaction counts
    prisma.account.findMany({
      where: { userId },
      orderBy: { name: "asc" },
      include: { _count: { select: { transactions: true } } },
    }),
    // Settings: all goals (no limit)
    prisma.goal.findMany({
      where: { userId },
      orderBy: [{ currentAmount: "desc" }, { name: "asc" }],
    }),
    // Loans
    prisma.loan.findMany({
      where: { userId },
      orderBy: [{ isSettled: "asc" }, { createdAt: "desc" }],
    }),
  ]);

  const currency = user?.currency || "BDT";

  // ── Home calculations ──
  const totalIncome = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + t.amount, 0);

  // ── Reports calculations ──
  const categoryMap: Record<
    string,
    { name: string; icon: string; color: string; total: number }
  > = {};
  transactions
    .filter((t) => t.type === "EXPENSE" && t.categoryId)
    .forEach((t) => {
      const key = t.categoryId!;
      if (!categoryMap[key]) {
        categoryMap[key] = {
          name: t.category?.name || "Unknown",
          icon: t.category?.icon || "📦",
          color: t.category?.color || "#6B7280",
          total: 0,
        };
      }
      categoryMap[key].total += t.amount;
    });
  const categoryBreakdown = Object.values(categoryMap).sort(
    (a, b) => b.total - a.total
  );

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

  // ── Budget calculations ──
  const spendingByCategory: Record<string, number> = {};
  for (const txn of budgetExpenseTransactions) {
    if (!txn.categoryId) continue;
    spendingByCategory[txn.categoryId] =
      (spendingByCategory[txn.categoryId] || 0) + txn.amount;
  }
  const totalBudget = budgets.reduce((sum, b) => sum + b.limit, 0);
  const totalSpent = budgets.reduce(
    (sum, b) => sum + (spendingByCategory[b.categoryId] || 0),
    0
  );

  const monthLabel = now.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const budgetMonthLabel = new Date(year, month).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Check if user has any transactions today (for reminder banner)
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const hasTransactionsToday = transactions.some(
    (t) => new Date(t.date) >= todayStart
  );

  return (
    <AppClient
      // Home
      transactions={JSON.parse(JSON.stringify(transactions))}
      totalIncome={totalIncome}
      totalExpense={totalExpense}
      currency={currency}
      currentMonth={month}
      currentYear={year}
      goals={JSON.parse(JSON.stringify(goals))}
      incomeCategories={JSON.parse(JSON.stringify(incomeCategories))}
      expenseCategories={JSON.parse(JSON.stringify(expenseCategories))}
      accounts={JSON.parse(JSON.stringify(accounts))}
      hasTransactionsToday={hasTransactionsToday}
      // Reports
      reportsTotalIncome={totalIncome}
      reportsTotalExpense={totalExpense}
      categoryBreakdown={categoryBreakdown}
      dailyData={dailyData}
      monthLabel={monthLabel}
      // Budgets
      budgets={JSON.parse(JSON.stringify(budgets))}
      spendingByCategory={spendingByCategory}
      totalBudget={totalBudget}
      totalSpent={totalSpent}
      currentBudgetMonth={startOfMonth.toISOString()}
      budgetMonthLabel={budgetMonthLabel}
      // Settings
      user={JSON.parse(JSON.stringify(user || {
        name: null,
        email: "",
        currency: "BDT",
        language: "en",
        budgetPeriod: 1,
        viewPeriod: "monthly",
        role: "USER",
        settings: null,
      }))}
      // Settings sub-views
      categoriesWithCounts={JSON.parse(JSON.stringify(categoriesWithCounts))}
      accountsWithCounts={JSON.parse(JSON.stringify(accountsWithCounts))}
      allGoals={JSON.parse(JSON.stringify(allGoals))}
      allLoans={JSON.parse(JSON.stringify(allLoans))}
    />
  );
}
